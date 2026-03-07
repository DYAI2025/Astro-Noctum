#!/usr/bin/env npx tsx
/**
 * Registry Lint Script
 *
 * Scans the codebase for ID references (trait.*, marker.*, tag.*, unlock.*, field.*)
 * and validates they exist in the registry.
 *
 * Usage:
 *   npx tsx scripts/registry-lint.ts
 *   npm run registry:lint
 *
 * Exit codes:
 *   0 - All IDs valid
 *   1 - Invalid IDs found
 */

import * as fs from "fs";
import * as path from "path";
import {
  isValidTraitId,
  isValidMarkerId,
  isValidTagId,
  isValidUnlockId,
  isValidFieldId,
  getIdType,
} from "../src/lib/registry";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");

// Directories to skip
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "out",
  ".worktrees",
  "coverage",
  ".swarm",
]);

// File extensions to scan
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".json", ".js", ".jsx"]);

// Files to skip (registry files themselves)
const SKIP_FILES = new Set([
  "traits.ts",
  "markers.ts",
  "tags.ts",
  "unlocks.ts",
  "fields.ts",
  "registry-lint.ts",
]);

// Regex patterns to find IDs
const ID_PATTERNS = [
  // String literals: "trait.social.introversion"
  /["'`](trait\.[a-z_]+\.[a-z_]+)["'`]/g,
  /["'`](marker\.[a-z_]+\.[a-z_]+(?:\.[a-z_]+)?)["'`]/g,
  /["'`](tag\.[a-z_]+\.[a-z_]+(?:\.[a-z_]+)?)["'`]/g,
  /["'`](unlock\.[a-z_]+\.[a-z_]+(?:_[a-z]+)?)["'`]/g,
  /["'`](field\.[a-z_]+\.[a-z_]+)["'`]/g,

  // Template literals with prefixes: `unlock.sigils.zodiac_${sign}`
  // We extract the prefix and validate it separately
  /`(trait\.[a-z_]+\.[a-z_]*)\$\{/g,
  /`(marker\.[a-z_]+\.[a-z_]*)\$\{/g,
  /`(tag\.[a-z_]+\.[a-z_]*)\$\{/g,
  /`(unlock\.[a-z_]+\.[a-z_]*)\$\{/g,
  /`(field\.[a-z_]+\.[a-z_]*)\$\{/g,
];

// Template literal prefixes that are allowed (validated via prefix rules)
const ALLOWED_TEMPLATE_PREFIXES = new Set([
  "unlock.sigils.zodiac_",
  "unlock.sigils.element_",
  "unlock.badges.chinese_",
  "unlock.crests.",
  "tag.astro.zodiac.",
  "tag.astro.chinese.",
]);

// Allowlist file (optional)
const ALLOWLIST_PATH = path.join(ROOT_DIR, "scripts/registry-lint.allowlist.txt");

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type IdMatch = {
  id: string;
  file: string;
  line: number;
  isTemplatePrefix: boolean;
};

type LintError = {
  id: string;
  file: string;
  line: number;
  type: string;
  message: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

type Allowlist = {
  exact: Set<string>;
  prefixes: string[];
};

function loadAllowlist(): Allowlist {
  const result: Allowlist = { exact: new Set(), prefixes: [] };
  try {
    if (fs.existsSync(ALLOWLIST_PATH)) {
      const content = fs.readFileSync(ALLOWLIST_PATH, "utf-8");
      const lines = content
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));

      for (const line of lines) {
        // Lines ending with . are prefix patterns
        if (line.endsWith(".")) {
          result.prefixes.push(line);
        } else {
          result.exact.add(line);
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return result;
}

/**
 * Check if an ID is in the allowlist (exact match or prefix match)
 */
function isAllowlisted(id: string, allowlist: Allowlist): boolean {
  // Check exact match
  if (allowlist.exact.has(id)) {
    return true;
  }
  // Check prefix match
  for (const prefix of allowlist.prefixes) {
    if (id.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

function getFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (SCAN_EXTENSIONS.has(ext) && !SKIP_FILES.has(entry.name)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

function findIdsInFile(filePath: string): IdMatch[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const matches: IdMatch[] = [];

  lines.forEach((line, lineIndex) => {
    for (const pattern of ID_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const id = match[1];
        const isTemplatePrefix = pattern.source.includes("\\$\\{");

        matches.push({
          id,
          file: filePath,
          line: lineIndex + 1,
          isTemplatePrefix,
        });
      }
    }
  });

  return matches;
}

function validateId(id: string, isTemplatePrefix: boolean): boolean {
  // Template prefixes are validated differently
  if (isTemplatePrefix) {
    // Check if this prefix is in the allowed list
    for (const prefix of ALLOWED_TEMPLATE_PREFIXES) {
      if (id === prefix || id.startsWith(prefix.slice(0, -1))) {
        return true;
      }
    }
    return false;
  }

  // Full ID validation
  const type = getIdType(id);
  switch (type) {
    case "trait":
      return isValidTraitId(id);
    case "marker":
      return isValidMarkerId(id);
    case "tag":
      return isValidTagId(id);
    case "unlock":
      return isValidUnlockId(id);
    case "field":
      return isValidFieldId(id);
    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

function main() {
  console.log("🔍 Registry Lint: Scanning for ID references...\n");

  const allowlist = loadAllowlist();
  const files = getFiles(SRC_DIR);
  const errors: LintError[] = [];
  let totalIds = 0;

  for (const file of files) {
    const matches = findIdsInFile(file);

    for (const match of matches) {
      totalIds++;

      // Skip allowlisted IDs
      if (isAllowlisted(match.id, allowlist)) {
        continue;
      }

      if (!validateId(match.id, match.isTemplatePrefix)) {
        const relativePath = path.relative(ROOT_DIR, match.file);
        errors.push({
          id: match.id,
          file: relativePath,
          line: match.line,
          type: getIdType(match.id),
          message: match.isTemplatePrefix
            ? `Template prefix "${match.id}" is not in allowed prefixes`
            : `ID "${match.id}" not found in registry`,
        });
      }
    }
  }

  // Output results
  console.log(`📊 Scanned ${files.length} files, found ${totalIds} ID references\n`);

  if (errors.length === 0) {
    console.log("✅ All IDs are valid!\n");
    process.exit(0);
  }

  console.log(`❌ Found ${errors.length} invalid ID(s):\n`);

  // Group errors by file
  const byFile = new Map<string, LintError[]>();
  for (const error of errors) {
    if (!byFile.has(error.file)) {
      byFile.set(error.file, []);
    }
    byFile.get(error.file)!.push(error);
  }

  for (const [file, fileErrors] of byFile) {
    console.log(`  ${file}:`);
    for (const error of fileErrors) {
      console.log(`    Line ${error.line}: ${error.message}`);
    }
    console.log();
  }

  console.log("💡 To fix:");
  console.log("   1. Add missing IDs to the appropriate registry file in src/lib/registry/");
  console.log("   2. Or add IDs to scripts/registry-lint.allowlist.txt if intentionally dynamic\n");

  process.exit(1);
}

main();
