// @ts-check
/**
 * Shared ISR cache handler backed by Upstash Redis.
 *
 * WHY THIS EXISTS
 * ---------------
 * Amplify Hosting Gen 1 SSR runs this app across multiple Lambda instances.
 * Next's default `FileSystemCache` keeps its tag-invalidation state in a
 * module-level `Map` (see `next/dist/server/lib/incremental-cache/
 * tags-manifest.external.js`), which is per-process. So `revalidatePath()` only
 * invalidates the single instance that handled the mutation — every other warm
 * instance keeps serving stale content until its own `revalidate` timer fires.
 *
 * That is why the public pages were dropped to `revalidate = 60` in Jun 2026:
 * the short timer was the only thing bounding staleness across instances. But a
 * 60s window is shorter than Neon's 5-minute scale-to-zero, so the database
 * never got to suspend. This handler moves the tag manifest into Redis so
 * invalidation propagates, which is what makes a long `revalidate` safe again.
 *
 * INTERFACE
 * ---------
 * Next 16 ships two cache interfaces. This implements the legacy class-based
 * `cacheHandler` (singular) used by ISR — `get`/`set`/`revalidateTag`/
 * `resetRequestCache`, verified against
 * `next/dist/server/lib/incremental-cache/index.d.ts` in 16.2.2. The
 * `ReadableStream`-based shape in some docs belongs to `cacheHandlers` (plural),
 * which drives `"use cache"` — this repo has no `use cache`/`cacheTag`/
 * `unstable_cache` usage, so that interface is never invoked here.
 *
 * LOADING
 * -------
 * Next `import()`s this file from disk at runtime, outside the bundler. It is
 * therefore plain CommonJS with no `@/*` aliases and no TypeScript. Keep it
 * dependency-free: Redis is reached over the Upstash REST API with `fetch`,
 * which also gives exact control over timeouts (the `@upstash/redis` client's
 * retry policy would add seconds of latency to the request path in an outage).
 */

// NOTE: no top-level `require("node:fs")` / `node:path` / `node:crypto`.
// Next pulls this module into the Edge runtime compilation too (the app has an
// edge OG route at src/app/opengraph-image.tsx), and Edge cannot resolve Node
// builtins at module evaluation — a top-level require fails the build with
// "Cannot find module 'node:fs': Unsupported external type Url". Everything
// Node-specific is required lazily inside a try/catch instead, so the module
// evaluates harmlessly under Edge and simply skips the disk tier there.

const TAGS_HEADER = "x-next-cache-tags"; // NEXT_CACHE_TAGS_HEADER
const TAGS_KEY = "isr:tags";
const ENTRY_TTL_SECONDS = 172800; // 48h — outlives a deploy, GCs old builds
/**
 * Timeout budget for a Redis round trip.
 *
 * Measured directly from Node against this Upstash instance: ~80ms median.
 * Measured from INSIDE a running `next start` server: **409–544ms** for the
 * same call. Next patches global `fetch` with its own cache instrumentation,
 * and that patch costs roughly 5x. Budgets of 250ms and then 1000ms both proved
 * too tight — the first call timed out, opened the circuit breaker, and
 * silently reduced this handler to a no-op while every log line still looked
 * healthy. That is the failure mode this generous budget exists to prevent.
 *
 * Follow-up worth doing: talk to Upstash over `node:https` instead of `fetch` to
 * sidestep Next's patch entirely and get back to ~80ms.
 */
const REDIS_TIMEOUT_MS = Number(process.env.ISR_CACHE_TIMEOUT_MS || 3000);
const CIRCUIT_OPEN_MS = 10000;
const TAG_POLL_MS = 2000; // throttle manifest refetches under load
const MAX_ENTRY_BYTES = 4 * 1024 * 1024; // skip oversized writes (Upstash req cap is 10MB)
const LRU_MAX = 64;

const DEBUG = process.env.ISR_CACHE_DEBUG === "1";

/**
 * Redis is bypassed entirely during `next build`: the build container may not
 * be able to reach Upstash, and any entry written would be orphaned by the next
 * BUILD_ID anyway. Prerendered output still lands on disk, so the first request
 * after a deploy serves a fresh artifact with no DB query and no Redis
 * dependency, then warms Redis lazily.
 */
const DISABLED =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.ISR_CACHE_DISABLE === "1" ||
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN;

// ── Serialization ────────────────────────────────────────────────────────────
// Cache values contain `Buffer` (rscData) and `Map<string, Buffer>`
// (segmentData). A JSON.stringify replacer is subtly wrong here because
// Buffer.prototype.toJSON already produces {type:"Buffer",data:[...]}, so we
// walk the structure explicitly instead.

/** @param {unknown} v */
function toWire(v) {
  if (v == null) return v;
  if (Buffer.isBuffer(v)) return { __t: "b", d: v.toString("base64") };
  if (v instanceof Map) {
    return { __t: "m", d: Array.from(v.entries()).map(([k, val]) => [k, toWire(val)]) };
  }
  if (Array.isArray(v)) return v.map(toWire);
  if (typeof v === "object") {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = toWire(val);
    return out;
  }
  return v;
}

/** @param {any} v */
function fromWire(v) {
  if (v == null) return v;
  if (Array.isArray(v)) return v.map(fromWire);
  if (typeof v === "object") {
    if (v.__t === "b") return Buffer.from(v.d, "base64");
    if (v.__t === "m") return new Map(v.d.map(([k, val]) => [k, fromWire(val)]));
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = fromWire(val);
    return out;
  }
  return v;
}

// ── Upstash REST transport ───────────────────────────────────────────────────

let circuitOpenUntil = 0;

/**
 * Run a Redis pipeline. Returns `null` on any failure — callers must treat that
 * as "unknown", never as "empty".
 * @param {unknown[][]} commands
 * @returns {Promise<any[] | null>}
 */
async function redis(commands) {
  if (DISABLED || Date.now() < circuitOpenUntil) return null;
  const started = Date.now();
  try {
    const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
    const json = await res.json();
    if (DEBUG) console.log(`[isr-cache] redis ok in ${Date.now() - started}ms`);
    return Array.isArray(json) ? json.map((r) => r.result) : null;
  } catch (err) {
    circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
    console.error(
      `[isr-cache] redis unavailable after ${Date.now() - started}ms, degrading to local/disk:`,
      String(err)
    );
    return null;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

// Plain Math.random rather than node:crypto — this is only a log label, and it
// must not pull a Node builtin in at module scope (see the note at the top).
const INSTANCE_ID = Math.random().toString(36).slice(2, 10);
let loggedInit = false;

/** @type {Map<string, {expired: number}>} */
let tagManifest = new Map();
let tagManifestFetchedAt = 0;

/**
 * The entry cache is MODULE-level, not per-handler-instance.
 *
 * Next constructs this class many times within a single server process (33-48
 * times was observed in a `next start` run). A per-instance `Map` would
 * therefore start empty on nearly every use, making the local tier dead weight
 * and charging a Redis round trip to every single request. Module scope is
 * per-process, which is exactly the granularity we want: one cache per Lambda.
 * @type {Map<string, any>}
 */
const entryCache = new Map();

module.exports = class RedisIsrCacheHandler {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
    this.lru = entryCache;

    // Build id scopes every entry. Serving build N's RSC payload under build
    // N+1 causes hydration failures, so a new BUILD_ID must start cold.
    //
    // If BUILD_ID is unreadable we fall back to a value unique to THIS PROCESS,
    // never a shared constant: a constant would make every build share one
    // namespace, which is the exact corruption this key is meant to prevent.
    // The random fallback degrades the entry cache to per-instance (losing the
    // sharing benefit) while staying correct — and tag invalidation still
    // propagates, because `isr:tags` is deliberately not build-scoped.
    this.buildId = `nobuildid-${INSTANCE_ID}`;
    try {
      // Lazy requires: unavailable under the Edge runtime, where this whole
      // block is expected to throw and the per-instance fallback applies.
      const fs = require("node:fs");
      const path = require("node:path");
      const id = fs.readFileSync(path.join(ctx.serverDistDir, "..", "BUILD_ID"), "utf8").trim();
      if (id) this.buildId = id;
      else throw new Error("empty BUILD_ID");
    } catch (err) {
      // Expected during `next build` (BUILD_ID is written at the end) and in
      // dev, where Redis is disabled anyway. Unexpected at runtime — warn so it
      // is visible in CloudWatch rather than silently halving the cache.
      if (!DISABLED) {
        console.error(
          `[isr-cache] BUILD_ID unreadable at runtime, falling back to per-instance scope: ${String(err)}`
        );
      }
    }

    // Third tier: Next's own on-disk cache. This is what makes a Redis outage
    // degrade to stale content instead of falling through to the database.
    this.fsCache = null;
    try {
      const mod = require("next/dist/server/lib/incremental-cache/file-system-cache");
      const FileSystemCache = mod.default ?? mod;
      this.fsCache = new FileSystemCache(ctx);
    } catch (err) {
      console.error("[isr-cache] FileSystemCache unavailable:", String(err));
    }

    // Once per process, not once per construction — Next builds this class
    // dozens of times per server, and a line per construction drowns CloudWatch.
    if (!loggedInit) {
      loggedInit = true;
      console.log(
        `[isr-cache] init instance=${INSTANCE_ID} build=${this.buildId} redis=${!DISABLED}`
      );
    }
  }

  /** @param {string} key */
  entryKey(key) {
    return `isr:${this.buildId}:e:${key}`;
  }

  /**
   * Fetch the shared tag manifest, memoized per request and throttled in time.
   * On failure the previous snapshot is KEPT — resetting to empty would forget
   * prior invalidations and start serving content we know is stale.
   */
  async loadTags() {
    if (Date.now() - tagManifestFetchedAt < TAG_POLL_MS) return;
    const out = await redis([["HGETALL", TAGS_KEY]]);
    if (!out) return; // keep last-known manifest
    tagManifestFetchedAt = Date.now();
    const flat = out[0];
    const next = new Map();
    if (Array.isArray(flat)) {
      for (let i = 0; i < flat.length; i += 2) {
        const expired = Number(flat[i + 1]);
        if (Number.isFinite(expired)) next.set(flat[i], { expired });
      }
    } else if (flat && typeof flat === "object") {
      for (const [tag, val] of Object.entries(flat)) {
        const expired = Number(val);
        if (Number.isFinite(expired)) next.set(tag, { expired });
      }
    }
    tagManifest = next;
  }

  /**
   * Mirrors Next's `areTagsExpired`: a tag expires an entry when it was
   * invalidated at or before now, but after the entry was written.
   * @param {string[]} tags
   * @param {number} lastModified
   */
  expired(tags, lastModified) {
    const now = Date.now();
    for (const tag of tags) {
      const entry = tagManifest.get(tag);
      if (entry && entry.expired <= now && entry.expired > lastModified) return true;
    }
    return false;
  }

  /** @param {any} entry */
  static tagsOf(entry) {
    const header = entry?.value?.headers?.[TAGS_HEADER];
    return typeof header === "string" && header ? header.split(",") : [];
  }

  /**
   * Three-tier read: in-process LRU → Redis → on-disk build artifact.
   * Only the final tier may return `null` (a genuine miss → regeneration).
   * @param {string} key
   * @param {any} ctx
   */
  async get(key, ctx) {
    await this.loadTags();

    const local = this.lru.get(key);
    if (local && !this.expired(RedisIsrCacheHandler.tagsOf(local), local.lastModified)) {
      return local;
    }

    const out = await redis([["GET", this.entryKey(key)]]);
    if (out && typeof out[0] === "string") {
      try {
        const entry = fromWire(JSON.parse(out[0]));
        if (!this.expired(RedisIsrCacheHandler.tagsOf(entry), entry.lastModified)) {
          this.remember(key, entry);
          return entry;
        }
        if (DEBUG) console.log(`[isr-cache] tag-expired ${key}`);
        return null;
      } catch (err) {
        // Never throw on a decode failure — treat as a miss and fall through.
        console.error(`[isr-cache] decode failed for ${key}:`, String(err));
      }
    }

    if (this.fsCache) {
      try {
        const disk = await this.fsCache.get(key, ctx);
        if (!disk) return null;
        // CRITICAL: apply OUR tag check to the disk entry as well.
        //
        // FileSystemCache checks tags against Next's own module-level
        // `tagsManifest`, which is empty in this process — `revalidateTag` is
        // routed to this handler instead of to that manifest. Returning the disk
        // entry unchecked therefore made the build artifact look valid forever,
        // so a shared invalidation never evicted it and pages served stale
        // content indefinitely with `x-nextjs-cache: HIT`.
        if (this.expired(RedisIsrCacheHandler.tagsOf(disk), disk.lastModified)) {
          if (DEBUG) console.log(`[isr-cache] disk entry tag-expired ${key}`);
          return null;
        }
        return disk;
      } catch (err) {
        console.error(`[isr-cache] disk read failed for ${key}:`, String(err));
      }
    }
    return null;
  }

  /**
   * @param {string} key
   * @param {any} data
   * @param {any} ctx
   */
  async set(key, data, ctx) {
    const entry = { value: data, lastModified: Date.now() };
    this.remember(key, entry);

    // On Lambda the deployment package is read-only, so a disk write is a
    // guaranteed EROFS that only fills CloudWatch. Dev only.
    if (this.ctx?.dev && this.fsCache) {
      try {
        await this.fsCache.set(key, data, ctx);
      } catch {
        /* non-fatal */
      }
    }

    if (DISABLED) return;
    let payload;
    try {
      payload = JSON.stringify(toWire(entry));
    } catch (err) {
      console.error(`[isr-cache] encode failed for ${key}:`, String(err));
      return;
    }
    if (payload.length > MAX_ENTRY_BYTES) {
      console.error(`[isr-cache] entry too large, not cached remotely: ${key}`);
      return;
    }
    await redis([["SET", this.entryKey(key), payload, "EX", ENTRY_TTL_SECONDS]]);
  }

  /**
   * Record a tag invalidation. Applied locally FIRST so this instance is
   * correct even if the Redis write fails; a lost write self-heals within the
   * page's `revalidate` window, which is why that stays a finite number.
   * @param {string | string[]} tags
   */
  async revalidateTag(tags) {
    const list = (Array.isArray(tags) ? tags : [tags]).filter(Boolean);
    if (!list.length) return;

    const now = Date.now();
    for (const tag of list) tagManifest.set(tag, { expired: now });

    // The manifest is deliberately NOT build-scoped: an invalidation issued
    // during a deploy must still apply to the build that follows it.
    const args = [];
    for (const tag of list) args.push(tag, String(now));
    const ok = await redis([["HSET", TAGS_KEY, ...args]]);
    if (!ok) {
      console.error(`[isr-cache] REVALIDATION LOST (redis down) for tags: ${list.join(", ")}`);
    }
  }

  resetRequestCache() {
    // Force the next `get` to refetch the manifest rather than reuse this
    // request's snapshot.
    tagManifestFetchedAt = 0;
  }

  /**
   * @param {string} key
   * @param {any} entry
   */
  remember(key, entry) {
    this.lru.delete(key);
    this.lru.set(key, entry);
    if (this.lru.size > LRU_MAX) {
      const oldest = this.lru.keys().next().value;
      if (oldest !== undefined) this.lru.delete(oldest);
    }
  }
};

// Exported for unit tests.
module.exports.toWire = toWire;
module.exports.fromWire = fromWire;
