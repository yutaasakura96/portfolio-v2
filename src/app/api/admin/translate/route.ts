import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { Prisma, prisma } from "@/lib/prisma-client";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";
import { z } from "zod";

const TRANSLATION_TARGETS = [
  "hero",
  "about",
  "settings",
  "project",
  "blogPost",
  "experience",
  "education",
] as const;

type TranslationTarget = (typeof TRANSLATION_TARGETS)[number];
type TranslationCountKey =
  | "hero"
  | "about"
  | "settings"
  | "projects"
  | "blog"
  | "experience"
  | "education";
type TranslationCounts = Record<TranslationCountKey, number>;

const translationRequestSchema = z.object({
  target: z.enum(TRANSLATION_TARGETS),
  id: z.string().optional(),
});

const SYSTEM_PROMPT = `You are translating a personal portfolio website from English to Japanese.

## Owner
- English name: Yuta Asakura
- Japanese name (kanji): 朝倉優太 — ALWAYS use this exact kanji. Never use 雄太, 悠太, or other variants.

## Company name mappings (use the Japanese form when the English name appears)
- "Sogo & Seibu" / "Sogo & Seibu Co., Ltd." → 株式会社そごう・西武
- "HCLTech" → 株式会社エイチシーエルジャパン
- "TierLine Inc." → 株式会社ティアライン
- "Watanabe Construction Industry Co." → 株式会社渡部建設工業
- "AMA University" → AMA University (keep in English)
- "Le Wagon Tokyo" → Le Wagon Tokyo (keep in English)
- "Southville International School and Colleges" → Southville International School and Colleges (keep in English)

## Translation rules
- Write natural, professional Japanese suitable for a portfolio site. Avoid stiff machine-translation tone.
- Use です/ます form (polite style) for descriptions and bios.
- Preserve all Markdown formatting, HTML tags, URLs, and code blocks exactly as-is.
- Keep technical terms in English: AWS, Next.js, TypeScript, React, Spring Boot, Docker, PostgreSQL, Prisma, etc.
- Keep certification names, degree program names, and institution names in English unless a well-known Japanese form exists.
- For job titles, translate the role but keep company names in their Japanese form from the mappings above.

## Output format
Return ONLY valid JSON with the exact same keys as the input. No markdown fences. No explanation.`;

type AnthropicResponse = {
  content?: Array<{
    type: string;
    text?: string;
  }>;
};

type TranslationPlan = {
  projectIds: string[];
  blogPostIds: string[];
};

function emptyCounts(): TranslationCounts {
  return {
    hero: 0,
    about: 0,
    settings: 0,
    projects: 0,
    blog: 0,
    experience: 0,
    education: 0,
  };
}

async function callHaiku(apiKey: string, input: unknown, maxTokens = 4096): Promise<unknown> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Translate this JSON to Japanese:\n${JSON.stringify(input)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Anthropic API error:", response.status, errorBody);
    throw new Error(`Anthropic API returned ${response.status}`);
  }

  const result = (await response.json()) as AnthropicResponse;
  const text = result.content?.find((b: { type: string }) => b.type === "text")?.text;
  if (!text) throw new Error("No text in Anthropic response");

  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const firstJsonChar = cleaned.search(/[\[{]/);
    const lastObjectChar = cleaned.lastIndexOf("}");
    const lastArrayChar = cleaned.lastIndexOf("]");
    const lastJsonChar = Math.max(lastObjectChar, lastArrayChar);

    if (firstJsonChar >= 0 && lastJsonChar > firstJsonChar) {
      return JSON.parse(cleaned.slice(firstJsonChar, lastJsonChar + 1));
    }

    throw error;
  }
}

async function getTranslationPlan(): Promise<TranslationPlan> {
  const [projects, posts] = await Promise.all([
    prisma.project.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: { id: true },
    }),
  ]);

  return {
    projectIds: projects.map((project) => project.id),
    blogPostIds: posts.map((post) => post.id),
  };
}

async function translateHero(apiKey: string): Promise<number> {
  const hero = await prisma.hero.findFirst();
  if (hero) {
    try {
      const raw = await callHaiku(apiKey, {
        headline: hero.headline,
        subheadline: hero.subheadline ?? "",
        bio: hero.bio,
      });
      const translated = validateTranslatedRecord(raw, ["headline", "subheadline", "bio"]);
      if (!translated) return 0;

      let ctaButtonsJa: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull;
      if (Array.isArray(hero.ctaButtons)) {
        const labels = (hero.ctaButtons as Array<{ label: string }>).map((b) => b.label);
        const rawLabels = await callHaiku(apiKey, { labels });
        const translatedLabels =
          rawLabels &&
          typeof rawLabels === "object" &&
          Array.isArray((rawLabels as { labels?: unknown }).labels)
            ? (rawLabels as { labels: string[] }).labels
            : [];
        ctaButtonsJa = (hero.ctaButtons as Array<Record<string, unknown>>).map((b, i) => ({
          ...b,
          label: translatedLabels[i] ?? b.label,
        })) as unknown as Prisma.InputJsonValue;
      }

      await prisma.hero.update({
        where: { id: hero.id },
        data: {
          headlineJa: "朝倉優太です！",
          subheadlineJa: translated.subheadline || null,
          bioJa: translated.bio,
          ctaButtonsJa,
        },
      });
      return 1;
    } catch (e) {
      console.error("Failed to translate hero:", e);
    }
  }

  return 0;
}

async function translateAbout(apiKey: string): Promise<number> {
  const about = await prisma.aboutPage.findUnique({ where: { id: "default" } });
  if (about) {
    try {
      const keys = ["heading", "subheading", "profileTitle", "introHeadline", "introBio"];
      const raw = await callHaiku(apiKey, {
        heading: about.heading,
        subheading: about.subheading,
        profileTitle: about.profileTitle ?? "",
        introHeadline: about.introHeadline ?? "",
        introBio: about.introBio ?? "",
      });
      const translated = validateTranslatedRecord(raw, keys);
      if (!translated) return 0;

      await prisma.aboutPage.update({
        where: { id: "default" },
        data: {
          headingJa: translated.heading,
          subheadingJa: translated.subheading,
          profileTitleJa: translated.profileTitle || null,
          introHeadlineJa: translated.introHeadline || null,
          introBioJa: translated.introBio || null,
        },
      });
      return 1;
    } catch (e) {
      console.error("Failed to translate about:", e);
    }
  }

  return 0;
}

async function translateSettings(apiKey: string): Promise<number> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (settings?.siteDescription) {
    try {
      const raw = await callHaiku(apiKey, {
        siteDescription: settings.siteDescription,
      });
      const translated = validateTranslatedRecord(raw, ["siteDescription"]);
      if (!translated?.siteDescription) return 0;

      await prisma.siteSettings.update({
        where: { id: "default" },
        data: { siteDescriptionJa: translated.siteDescription },
      });
      return 1;
    } catch (e) {
      console.error("Failed to translate settings:", e);
    }
  }

  return 0;
}

function validateTranslatedRecord(
  raw: unknown,
  expectedKeys: string[]
): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const result: Record<string, string> = {};
  for (const key of expectedKeys) {
    const val = (raw as Record<string, unknown>)[key];
    if (typeof val === "string" && val.length <= 10000) {
      result[key] = val;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

function validateTranslatedArray<T extends { id: string }>(
  raw: unknown,
  validIds: Set<string>,
  expectedKeys: string[]
): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is T => {
    if (!item || typeof item !== "object") return false;
    const rec = item as Record<string, unknown>;
    if (typeof rec.id !== "string" || !validIds.has(rec.id)) return false;
    for (const key of expectedKeys) {
      const val = rec[key];
      if (val !== undefined && typeof val !== "string" && !Array.isArray(val)) return false;
    }
    return true;
  });
}

async function translateProject(apiKey: string, id: string): Promise<number> {
  const project = await prisma.project.findFirst({ where: { id, status: "PUBLISHED" } });
  if (!project) return 0;

  try {
    const keys = ["title", "shortDescription", "description", "problem", "solution", "role"];
    const raw = await callHaiku(apiKey, {
      title: project.title,
      shortDescription: project.shortDescription,
      description: project.description ?? "",
      problem: project.problem ?? "",
      solution: project.solution ?? "",
      role: project.role ?? "",
    });
    const translated = validateTranslatedRecord(raw, keys);
    if (!translated) return 0;

    await prisma.project.update({
      where: { id: project.id },
      data: {
        titleJa: translated.title,
        shortDescriptionJa: translated.shortDescription,
        descriptionJa: translated.description || null,
        problemJa: translated.problem || null,
        solutionJa: translated.solution || null,
        roleJa: translated.role || null,
      },
    });
    return 1;
  } catch (e) {
    console.error(`Failed to translate project ${project.slug}:`, e);
  }

  return 0;
}

async function translateBlogPost(apiKey: string, id: string): Promise<number> {
  const post = await prisma.blogPost.findFirst({ where: { id, status: "PUBLISHED" } });
  if (!post) return 0;

  try {
    const keys = ["title", "content", "excerpt"];
    const raw = await callHaiku(
      apiKey,
      {
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
      },
      post.content.length > 3000 ? 8192 : 4096
    );
    const translated = validateTranslatedRecord(raw, keys);
    if (!translated) return 0;

    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        titleJa: translated.title,
        contentJa: translated.content,
        excerptJa: translated.excerpt,
      },
    });
    return 1;
  } catch (e) {
    console.error(`Failed to translate blog post ${post.slug}:`, e);
  }

  return 0;
}

async function translateExperience(apiKey: string): Promise<number> {
  const experiences = await prisma.experience.findMany({ where: { visible: true } });
  if (experiences.length > 0) {
    try {
      const validIds = new Set(experiences.map((exp) => exp.id));
      const input = experiences.map((exp) => ({
        id: exp.id,
        role: exp.role,
        description: exp.description,
        highlights: exp.highlights,
      }));

      const raw = await callHaiku(apiKey, input, 8192);
      const translated = validateTranslatedArray<{
        id: string;
        role: string;
        description: string;
        highlights: string[];
      }>(raw, validIds, ["role", "description", "highlights"]);

      for (const item of translated) {
        await prisma.experience.update({
          where: { id: item.id },
          data: {
            roleJa: typeof item.role === "string" ? item.role : undefined,
            descriptionJa: typeof item.description === "string" ? item.description : undefined,
            highlightsJa: Array.isArray(item.highlights) ? item.highlights : [],
          },
        });
      }
      return translated.length;
    } catch (e) {
      console.error("Failed to translate experience:", e);
    }
  }

  return 0;
}

async function translateEducation(apiKey: string): Promise<number> {
  const educations = await prisma.education.findMany({ where: { visible: true } });
  if (educations.length > 0) {
    try {
      const validIds = new Set(educations.map((edu) => edu.id));
      const input = educations.map((edu) => ({
        id: edu.id,
        degree: edu.degree,
        achievements: edu.achievements ?? "",
      }));

      const raw = await callHaiku(apiKey, input);
      const translated = validateTranslatedArray<{
        id: string;
        degree: string;
        achievements: string;
      }>(raw, validIds, ["degree", "achievements"]);

      for (const item of translated) {
        await prisma.education.update({
          where: { id: item.id },
          data: {
            degreeJa: typeof item.degree === "string" ? item.degree : undefined,
            achievementsJa:
              typeof item.achievements === "string" ? item.achievements || null : null,
          },
        });
      }
      return translated.length;
    } catch (e) {
      console.error("Failed to translate education:", e);
    }
  }

  return 0;
}

async function translateTarget(
  apiKey: string,
  target: TranslationTarget,
  id?: string
): Promise<TranslationCounts> {
  const counts = emptyCounts();

  switch (target) {
    case "hero":
      counts.hero = await translateHero(apiKey);
      break;
    case "about":
      counts.about = await translateAbout(apiKey);
      break;
    case "settings":
      counts.settings = await translateSettings(apiKey);
      break;
    case "project":
      if (!id) {
        throw new ApiError("Project id is required", 400, ErrorCodes.VALIDATION_ERROR);
      }
      counts.projects = await translateProject(apiKey, id);
      break;
    case "blogPost":
      if (!id) {
        throw new ApiError("Blog post id is required", 400, ErrorCodes.VALIDATION_ERROR);
      }
      counts.blog = await translateBlogPost(apiKey, id);
      break;
    case "experience":
      counts.experience = await translateExperience(apiKey);
      break;
    case "education":
      counts.education = await translateEducation(apiKey);
      break;
  }

  return counts;
}

export const GET = withErrorHandler(async () => {
  await requireAuth();

  const plan = await getTranslationPlan();

  return Response.json({ data: plan });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json().catch(() => null);
  const parsed = translationRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const ip = getClientIp(request);
  const rlResult = await rateLimit(`translate:${ip}`, 60, 60 * 1000);
  if (!rlResult.success) {
    throw new ApiError("Please wait before translating again", 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ApiError(
      "Translation is not configured (missing ANTHROPIC_API_KEY)",
      503,
      ErrorCodes.INTERNAL_ERROR
    );
  }

  const counts = await translateTarget(apiKey, parsed.data.target, parsed.data.id);

  revalidatePath("/", "layout");

  return Response.json({ data: counts });
});
