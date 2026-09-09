/**
 * Validates amplify.yml before it can reach Amplify.
 *
 * Amplify rejects a malformed buildspec at parse time with a generic
 * "CustomerError: The commands provided in the buildspec are malformed", and the
 * build never starts — no npm ci, no next build. Because CI does not parse this
 * file, the mistake is invisible until a real deploy fails.
 *
 * The trap that motivated this: an unquoted command containing ": " (colon-space)
 * or a leading "{" is not a YAML string. YAML reads it as a mapping, so
 *
 *   - test -d foo || { echo "ERROR: missing"; exit 1; }
 *
 * parses to { 'test -d foo || { echo "ERROR': 'missing"; exit 1; }' } — an object
 * where Amplify requires a string. Quoting the whole scalar fixes it.
 *
 * Run: node scripts/validate-buildspec.mjs [path]
 * The optional path argument exists so the validator itself can be tested
 * against a deliberately broken fixture.
 */
import { readFileSync } from "node:fs";
import { load } from "js-yaml";

const FILE = process.argv[2] ?? "amplify.yml";
const problems = [];

let doc;
try {
  doc = load(readFileSync(FILE, "utf8"));
} catch (err) {
  console.error(`✗ ${FILE} is not valid YAML\n  ${err.message}`);
  process.exit(1);
}

const phases = doc?.frontend?.phases;
if (!phases || typeof phases !== "object") {
  problems.push("frontend.phases is missing — Amplify has nothing to run");
}

let commandCount = 0;
for (const [phase, body] of Object.entries(phases ?? {})) {
  const commands = body?.commands;

  if (!Array.isArray(commands)) {
    problems.push(`frontend.phases.${phase}.commands must be a list, got ${typeof commands}`);
    continue;
  }

  commands.forEach((command, i) => {
    commandCount++;
    if (typeof command === "string") return;

    const where = `frontend.phases.${phase}.commands[${i}]`;
    const hint =
      command && typeof command === "object"
        ? 'a ": " (colon-space) or leading "{" in an unquoted scalar makes YAML read it as a mapping — wrap the whole command in single quotes'
        : "wrap the command in quotes";
    problems.push(`${where} parsed as ${command === null ? "null" : typeof command}, not a string.\n    ${hint}\n    parsed value: ${JSON.stringify(command).slice(0, 160)}`);
  });
}

// The artifacts block decides what actually ships to the Lambda.
if (doc?.frontend?.artifacts?.baseDirectory !== ".next") {
  problems.push(`frontend.artifacts.baseDirectory should be ".next", got ${JSON.stringify(doc?.frontend?.artifacts?.baseDirectory)}`);
}

if (problems.length > 0) {
  console.error(`✗ ${FILE} is invalid:\n`);
  problems.forEach((p) => console.error(`  - ${p}\n`));
  process.exit(1);
}

console.log(`✓ ${FILE} valid — ${commandCount} commands across ${Object.keys(phases).length} phases, all strings`);
