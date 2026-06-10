import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { Prisma } from "@/lib/prismaClient";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

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
      system: SYSTEM_PROMPT,
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

  const result = await response.json();
  const text = result.content?.find((b: { type: string }) => b.type === "text")?.text;
  if (!text) throw new Error("No text in Anthropic response");

  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  return JSON.parse(cleaned);
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const ip = getClientIp(request);
  const rlResult = await rateLimit(`translate:${ip}`, 1, 60 * 1000);
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

  const [hero, about, settings, projects, posts, experiences, educations] = await Promise.all([
    prisma.hero.findFirst(),
    prisma.aboutPage.findUnique({ where: { id: "default" } }),
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.project.findMany({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.findMany({ where: { status: "PUBLISHED" } }),
    prisma.experience.findMany({ where: { visible: true } }),
    prisma.education.findMany({ where: { visible: true } }),
  ]);

  const counts = {
    hero: 0,
    about: 0,
    settings: 0,
    projects: 0,
    blog: 0,
    experience: 0,
    education: 0,
  };

  // Hero
  if (hero) {
    try {
      const translated = (await callHaiku(apiKey, {
        headline: hero.headline,
        subheadline: hero.subheadline ?? "",
        bio: hero.bio,
      })) as Record<string, string>;

      let ctaButtonsJa: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull;
      if (Array.isArray(hero.ctaButtons)) {
        const labels = (hero.ctaButtons as Array<{ label: string }>).map((b) => b.label);
        const translatedLabels = (await callHaiku(apiKey, {
          labels,
        })) as { labels: string[] };
        ctaButtonsJa = (hero.ctaButtons as Array<Record<string, unknown>>).map((b, i) => ({
          ...b,
          label: translatedLabels.labels?.[i] ?? b.label,
        })) as unknown as Prisma.InputJsonValue;
      }

      await prisma.hero.update({
        where: { id: hero.id },
        data: {
          headlineJa: "朝倉優太です!",
          subheadlineJa: translated.subheadline || null,
          bioJa: translated.bio,
          ctaButtonsJa,
        },
      });
      counts.hero = 1;
    } catch (e) {
      console.error("Failed to translate hero:", e);
    }
  }

  // About
  if (about) {
    try {
      const translated = (await callHaiku(apiKey, {
        heading: about.heading,
        subheading: about.subheading,
        profileTitle: about.profileTitle ?? "",
        introHeadline: about.introHeadline ?? "",
        introBio: about.introBio ?? "",
      })) as Record<string, string>;

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
      counts.about = 1;
    } catch (e) {
      console.error("Failed to translate about:", e);
    }
  }

  // Settings
  if (settings?.siteDescription) {
    try {
      const translated = (await callHaiku(apiKey, {
        siteDescription: settings.siteDescription,
      })) as Record<string, string>;

      await prisma.siteSettings.update({
        where: { id: "default" },
        data: { siteDescriptionJa: translated.siteDescription },
      });
      counts.settings = 1;
    } catch (e) {
      console.error("Failed to translate settings:", e);
    }
  }

  // Projects
  if (projects.length > 0) {
    try {
      const input = projects.map((p) => ({
        id: p.id,
        title: p.title,
        shortDescription: p.shortDescription,
        description: p.description ?? "",
        problem: p.problem ?? "",
        solution: p.solution ?? "",
        role: p.role ?? "",
      }));

      const translated = (await callHaiku(apiKey, input, 8192)) as Array<Record<string, string>>;

      for (const item of translated) {
        if (!item.id) continue;
        await prisma.project.update({
          where: { id: item.id },
          data: {
            titleJa: item.title,
            shortDescriptionJa: item.shortDescription,
            descriptionJa: item.description || null,
            problemJa: item.problem || null,
            solutionJa: item.solution || null,
            roleJa: item.role || null,
          },
        });
        counts.projects++;
      }
    } catch (e) {
      console.error("Failed to translate projects:", e);
    }
  }

  // Blog posts
  for (const post of posts) {
    try {
      const translated = (await callHaiku(
        apiKey,
        {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
        },
        post.content.length > 3000 ? 8192 : 4096
      )) as Record<string, string>;

      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          titleJa: translated.title,
          contentJa: translated.content,
          excerptJa: translated.excerpt,
        },
      });
      counts.blog++;
    } catch (e) {
      console.error(`Failed to translate blog post ${post.slug}:`, e);
    }
  }

  // Experience
  if (experiences.length > 0) {
    try {
      const input = experiences.map((exp) => ({
        id: exp.id,
        role: exp.role,
        description: exp.description,
        highlights: exp.highlights,
      }));

      const translated = (await callHaiku(apiKey, input, 8192)) as Array<{
        id: string;
        role: string;
        description: string;
        highlights: string[];
      }>;

      for (const item of translated) {
        if (!item.id) continue;
        await prisma.experience.update({
          where: { id: item.id },
          data: {
            roleJa: item.role,
            descriptionJa: item.description,
            highlightsJa: Array.isArray(item.highlights) ? item.highlights : [],
          },
        });
        counts.experience++;
      }
    } catch (e) {
      console.error("Failed to translate experience:", e);
    }
  }

  // Education
  if (educations.length > 0) {
    try {
      const input = educations.map((edu) => ({
        id: edu.id,
        degree: edu.degree,
        achievements: edu.achievements ?? "",
      }));

      const translated = (await callHaiku(apiKey, input)) as Array<{
        id: string;
        degree: string;
        achievements: string;
      }>;

      for (const item of translated) {
        if (!item.id) continue;
        await prisma.education.update({
          where: { id: item.id },
          data: {
            degreeJa: item.degree,
            achievementsJa: item.achievements || null,
          },
        });
        counts.education++;
      }
    } catch (e) {
      console.error("Failed to translate education:", e);
    }
  }

  revalidatePath("/", "layout");

  return Response.json({ data: counts });
});
