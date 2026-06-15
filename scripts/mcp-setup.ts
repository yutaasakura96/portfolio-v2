#!/usr/bin/env tsx
/**
 * One-time setup script for the Portfolio MCP server.
 *
 * Generates a high-entropy API key, stores the SHA-256 hash in the database
 * via Prisma directly (no HTTP round-trip), and appends PORTFOLIO_API_KEY
 * to .env so the MCP server can read it on startup.
 *
 * Prerequisites:
 *   - DATABASE_URL set in .env
 *
 * Usage:
 *   npm run mcp:setup
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline/promises";
import { createHash } from "crypto";
import { nanoid } from "nanoid";

const ENV_PATH = path.resolve(process.cwd(), ".env");

async function main(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const description = await rl.question('Key description (e.g. "Claude Code local MCP"): ');
  rl.close();

  if (!description.trim()) {
    console.error("Error: description is required.");
    process.exit(1);
  }

  // Dynamic import to avoid loading Prisma at module evaluation time
  const { prisma } = await import("../src/lib/prisma-client.js");

  const rawKey = nanoid(32);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.create({
    data: { keyHash, description: description.trim() },
  });

  await prisma.$disconnect();

  // Check if PORTFOLIO_API_KEY already exists in .env
  const envExists = fs.existsSync(ENV_PATH);
  const envContent = envExists ? fs.readFileSync(ENV_PATH, "utf8") : "";

  if (envContent.includes("PORTFOLIO_API_KEY=")) {
    console.log(
      "\nWarning: PORTFOLIO_API_KEY already exists in .env. Appending new key with a comment."
    );
  }

  const envLine = `\n# MCP API key — ${apiKey.description} (id: ${apiKey.id}, created: ${apiKey.createdAt.toISOString()})\nPORTFOLIO_API_KEY=${rawKey}\n`;
  fs.appendFileSync(ENV_PATH, envLine, "utf8");

  console.log("\n=== MCP API Key Generated ===");
  console.log(`ID:          ${apiKey.id}`);
  console.log(`Description: ${apiKey.description}`);
  console.log(`Created:     ${apiKey.createdAt.toISOString()}`);
  console.log(`\nKey appended to .env as PORTFOLIO_API_KEY`);
  console.log("This key will NOT be shown again.");
  console.log(".env is gitignored — the key will not be committed.");
  console.log("\nRestart Claude Code to load the portfolio MCP server with the new key.");
}

main().catch((err: unknown) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
