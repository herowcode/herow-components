#!/usr/bin/env node

/**
 * Release Script
 *
 * Usage:
 *   pnpm release:patch   # 0.1.0 -> 0.1.1
 *   pnpm release:minor   # 0.1.0 -> 0.2.0
 *   pnpm release:major   # 0.1.0 -> 1.0.0
 *
 * What it does:
 *   1. Runs typecheck
 *   2. Builds the CLI
 *   3. Bumps version in packages/cli/package.json
 *   4. Commits the version bump
 *   5. Creates a git tag
 *   6. Pushes to origin (commits + tags)
 *   7. Publishes to npm
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CLI_PKG_PATH = resolve(ROOT, "packages/cli/package.json");

const VALID_TYPES = ["patch", "minor", "major"];

/**
 * Execute a command safely using execFileSync (no shell injection)
 */
function run(cmd, args = [], options = {}) {
  const displayCmd = [cmd, ...args].join(" ");
  console.log(`\n→ ${displayCmd}`);
  return execFileSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    ...options,
  });
}

function runSilent(cmd, args = []) {
  return execFileSync(cmd, args, { cwd: ROOT, encoding: "utf-8" }).trim();
}

function bumpVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split(".").map(Number);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

async function main() {
  const type = process.argv[2];

  if (!type || !VALID_TYPES.includes(type)) {
    console.error(`\n❌ Usage: pnpm release [patch|minor|major]\n`);
    process.exit(1);
  }

  console.log("\n🚀 Starting release process...\n");

  // 1. Check for uncommitted changes
  try {
    const status = runSilent("git", ["status", "--porcelain"]);
    if (status) {
      console.error(
        "❌ Working directory is not clean. Commit or stash changes first.\n"
      );
      console.log(status);
      process.exit(1);
    }
  } catch {
    console.error("❌ Not a git repository or git not available");
    process.exit(1);
  }

  // 2. Typecheck
  console.log("📝 Running typecheck...");
  run("pnpm", ["typecheck"]);

  // 3. Build
  console.log("\n📦 Building CLI...");
  run("pnpm", ["build"]);

  // 4. Bump version
  const pkg = JSON.parse(readFileSync(CLI_PKG_PATH, "utf-8"));
  const currentVersion = pkg.version;
  const newVersion = bumpVersion(currentVersion, type);

  console.log(`\n🔖 Bumping version: ${currentVersion} → ${newVersion}`);

  pkg.version = newVersion;
  writeFileSync(CLI_PKG_PATH, JSON.stringify(pkg, null, 2) + "\n");

  // 5. Commit
  const commitMsg = `chore(release): @herowcode/cli v${newVersion}`;
  console.log(`\n📝 Committing: "${commitMsg}"`);
  run("git", ["add", "packages/cli/package.json"]);
  run("git", ["commit", "-m", commitMsg]);

  // 6. Tag
  const tagName = `v${newVersion}`;
  console.log(`\n🏷️  Creating tag: ${tagName}`);
  run("git", ["tag", "-a", tagName, "-m", `Release ${tagName}`]);

  // 7. Push
  console.log("\n⬆️  Pushing to origin...");
  run("git", ["push"]);
  run("git", ["push", "--tags"]);

  // 8. Publish
  console.log("\n📤 Publishing to npm...");
  run("npm", ["publish", "--access", "public"], {
    cwd: resolve(ROOT, "packages/cli"),
  });

  console.log(`\n✅ Successfully released @herowcode/cli v${newVersion}!\n`);
  console.log(`   npm: https://www.npmjs.com/package/@herowcode/cli`);
  console.log(
    `   tag: https://github.com/herowcode/herow-components/releases/tag/${tagName}\n`
  );
}

main().catch((err) => {
  console.error("\n❌ Release failed:", err.message);
  process.exit(1);
});
