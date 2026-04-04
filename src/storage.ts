/**
 * PDE Storage - .pde/ dot folder persistence
 * 
 * Stores decompositions as JSON + Markdown in .pde/ directory.
 * 
 * New folder-based layout (v2.1):
 *   .pde/
 *     <yyMMddHHmm>--<uuid>/
 *       pde-<uuid>.json     - StoredDecomposition (full JSON)
 *       pde-<uuid>.md       - Markdown export (human-editable, git-diffable)
 *       <child-timestamp>--<child-uuid>/   - nested children
 *         pde-<child-uuid>.json
 *         pde-<child-uuid>.md
 * 
 * Legacy flat layout (still readable):
 *   .pde/
 *     <id>.json
 *     <id>.md
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import type {
  DecompositionResult,
  DecompositionOptions,
  StoredDecomposition,
  Direction,
} from "./types.js";
import { DIRECTION_META, DIRECTIONS } from "./types.js";
import { actionStackToMarkdown } from "./parser.js";

const PDE_DIR = ".pde";

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
}

/** Generate timestamp in yyMMddHHmm format */
function generateTimestamp(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${yy}${MM}${dd}${HH}${mm}`;
}

/**
 * Find a PDE folder by UUID, searching recursively within .pde/.
 * Returns the folder path containing the PDE files, or null.
 */
function findFolderByUuid(pdeRoot: string, uuid: string): string | null {
  if (!existsSync(pdeRoot)) return null;

  // Search for folder ending with --<uuid>
  const suffix = `--${uuid}`;
  
  function searchDir(dir: string): string | null {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return null;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        if (!statSync(fullPath).isDirectory()) continue;
      } catch {
        continue;
      }
      if (entry.endsWith(suffix)) return fullPath;
      // Recurse into subdirectories (parent folders may contain children)
      const found = searchDir(fullPath);
      if (found) return found;
    }
    return null;
  }

  return searchDir(pdeRoot);
}

/**
 * Save a decomposition to .pde/ as JSON + Markdown using folder-based layout.
 */
export function saveDecomposition(
  workdir: string,
  id: string,
  prompt: string,
  result: DecompositionResult,
  options: DecompositionOptions,
  parentPdeId?: string,
): StoredDecomposition {
  const pdeRoot = join(workdir, PDE_DIR);
  ensureDir(pdeRoot);

  const ts = generateTimestamp();
  const folderName = `${ts}--${id}`;

  let targetDir: string;
  if (parentPdeId) {
    // Find parent folder and nest inside it
    const parentFolder = findFolderByUuid(pdeRoot, parentPdeId);
    if (parentFolder) {
      targetDir = join(parentFolder, folderName);
    } else {
      // Parent not found — store at top level (graceful fallback)
      targetDir = join(pdeRoot, folderName);
    }
  } else {
    targetDir = join(pdeRoot, folderName);
  }

  ensureDir(targetDir);

  const stored: StoredDecomposition = {
    id,
    timestamp: new Date().toISOString(),
    prompt,
    result,
    options,
    folder_name: folderName,
  };

  if (parentPdeId) {
    stored.parent_pde_id = parentPdeId;
  }

  // Save JSON
  const jsonPath = join(targetDir, `pde-${id}.json`);
  writeFileSync(jsonPath, JSON.stringify(stored, null, 2), "utf-8");

  // Save Markdown
  const mdPath = join(targetDir, `pde-${id}.md`);
  const md = decompositionToMarkdown(result, prompt, parentPdeId);
  writeFileSync(mdPath, md, "utf-8");
  stored.markdownPath = mdPath;

  return stored;
}

/**
 * Load a decomposition from .pde/ by ID.
 * Checks both new folder-based layout and legacy flat format.
 */
export function loadDecomposition(workdir: string, id: string): StoredDecomposition | null {
  const pdeRoot = join(workdir, PDE_DIR);

  // 1. Try new folder-based format: .pde/*--<uuid>/pde-<uuid>.json (recursive)
  const folder = findFolderByUuid(pdeRoot, id);
  if (folder) {
    const jsonPath = join(folder, `pde-${id}.json`);
    if (existsSync(jsonPath)) {
      const raw = readFileSync(jsonPath, "utf-8");
      return JSON.parse(raw) as StoredDecomposition;
    }
  }

  // 2. Try legacy flat format: .pde/<id>.json
  const legacyPath = join(pdeRoot, `${id}.json`);
  if (existsSync(legacyPath)) {
    const raw = readFileSync(legacyPath, "utf-8");
    return JSON.parse(raw) as StoredDecomposition;
  }

  return null;
}

/**
 * Recursively collect all PDE JSON files from a directory.
 */
function collectPdeFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isFile() && entry.endsWith(".json")) {
        // Match both pde-<uuid>.json (new) and <uuid>.json (legacy)
        if (entry.startsWith("pde-") || !entry.startsWith(".")) {
          results.push(fullPath);
        }
      } else if (stat.isDirectory() && !entry.startsWith(".")) {
        results.push(...collectPdeFiles(fullPath));
      }
    } catch {
      continue;
    }
  }

  return results;
}

/**
 * List all decompositions in .pde/ (flat list regardless of nesting).
 */
export function listDecompositions(workdir: string, limit?: number): StoredDecomposition[] {
  const pdeRoot = join(workdir, PDE_DIR);
  if (!existsSync(pdeRoot)) return [];

  const jsonFiles = collectPdeFiles(pdeRoot);

  const items: StoredDecomposition[] = [];
  for (const filePath of jsonFiles) {
    try {
      const raw = readFileSync(filePath, "utf-8");
      items.push(JSON.parse(raw) as StoredDecomposition);
    } catch {
      // Skip malformed files
    }
  }

  // Sort by timestamp descending
  items.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));

  return limit ? items.slice(0, limit) : items;
}

/**
 * List children of a specific parent PDE.
 */
export function listChildren(workdir: string, parentId: string): StoredDecomposition[] {
  const pdeRoot = join(workdir, PDE_DIR);
  const parentFolder = findFolderByUuid(pdeRoot, parentId);
  if (!parentFolder) return [];

  const children: StoredDecomposition[] = [];
  let entries: string[];
  try {
    entries = readdirSync(parentFolder);
  } catch {
    return [];
  }

  for (const entry of entries) {
    const childDir = join(parentFolder, entry);
    try {
      if (!statSync(childDir).isDirectory()) continue;
    } catch {
      continue;
    }
    // Look for pde-*.json inside the child folder
    const childFiles = collectPdeFiles(childDir);
    for (const filePath of childFiles) {
      try {
        const raw = readFileSync(filePath, "utf-8");
        const stored = JSON.parse(raw) as StoredDecomposition;
        if (stored.parent_pde_id === parentId) {
          children.push(stored);
        }
      } catch {
        continue;
      }
    }
  }

  children.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  return children;
}

/**
 * Convert a DecompositionResult to a git-diffable Markdown document.
 * IAIP canonical format: Four Directions as first section after title,
 * centering relational/directional knowing before reductive intent extraction.
 */
export function decompositionToMarkdown(result: DecompositionResult, prompt?: string, parentPdeId?: string): string {
  const lines: string[] = [];

  lines.push("# Prompt Decomposition");
  lines.push("");

  // Parent reference (when present)
  if (parentPdeId) {
    lines.push(`**Parent PDE:** \`${parentPdeId}\``);
    lines.push("");
  }

  // Four Directions (IAIP canonical: first section — relational knowing before intent)
  lines.push("## Four Directions");
  lines.push("");
  for (const dir of DIRECTIONS) {
    const meta = DIRECTION_META[dir];
    const items = result.directions[dir];
    if (items.length === 0) continue;
    const subtitle = meta.name.charAt(0) + meta.name.slice(1).toLowerCase();
    lines.push(`### ${meta.emoji} ${dir.toUpperCase()} — ${subtitle}`);
    lines.push("");
    for (const item of items) {
      const tag = item.implicit ? " _(implicit)_" : "";
      lines.push(`- ${item.text} [${Math.round(item.confidence * 100)}%]${tag}`);
    }
    lines.push("");
  }

  // Original prompt (if provided)
  if (prompt) {
    lines.push("## Original Prompt");
    lines.push("");
    lines.push(`> ${prompt.replace(/\n/g, "\n> ")}`);
    lines.push("");
  }

  // Primary Intent
  lines.push("## Primary Intent");
  lines.push("");
  lines.push(`**Action:** ${result.primary.action}`);
  lines.push(`**Target:** ${result.primary.target}`);
  lines.push(`**Urgency:** ${result.primary.urgency}`);
  lines.push(`**Confidence:** ${Math.round(result.primary.confidence * 100)}%`);
  lines.push("");

  // Secondary Intents
  if (result.secondary.length > 0) {
    lines.push("## Secondary Intents");
    lines.push("");
    for (let i = 0; i < result.secondary.length; i++) {
      const s = result.secondary[i];
      lines.push(`${i + 1}. **${s.action}** — ${s.target} _(${s.implicit ? "implicit" : "explicit"})_`);
      if (s.dependency) lines.push(`   - depends on: ${s.dependency}`);
    }
    lines.push("");
  }

  // Context Requirements
  const ctx = result.context;
  if (ctx.files_needed.length || ctx.tools_required.length || ctx.assumptions.length) {
    lines.push("## Context Requirements");
    lines.push("");
    if (ctx.files_needed.length) {
      lines.push("### Files Needed");
      ctx.files_needed.forEach((f) => lines.push(`- ${f}`));
      lines.push("");
    }
    if (ctx.tools_required.length) {
      lines.push("### Tools Required");
      ctx.tools_required.forEach((t) => lines.push(`- ${t}`));
      lines.push("");
    }
    if (ctx.assumptions.length) {
      lines.push("### Assumptions");
      ctx.assumptions.forEach((a) => lines.push(`- ${a}`));
      lines.push("");
    }
  }

  // Expected Outputs (IAIP canonical: before Action Stack)
  const out = result.outputs;
  if (out.artifacts.length || out.updates.length || out.communications.length) {
    lines.push("## Expected Outputs");
    lines.push("");
    if (out.artifacts.length) {
      lines.push("### Artifacts");
      out.artifacts.forEach((a) => lines.push(`- ${a}`));
      lines.push("");
    }
    if (out.updates.length) {
      lines.push("### Updates");
      out.updates.forEach((u) => lines.push(`- ${u}`));
      lines.push("");
    }
    if (out.communications.length) {
      lines.push("### Communications");
      out.communications.forEach((c) => lines.push(`- ${c}`));
      lines.push("");
    }
  }

  // Action Stack
  if (result.actionStack.length > 0) {
    lines.push("## Action Stack");
    lines.push("");
    lines.push(actionStackToMarkdown(result.actionStack));
    lines.push("");
  }

  // Ambiguity Flags
  if (result.ambiguities.length > 0) {
    lines.push("## Ambiguity Flags");
    lines.push("");
    for (const a of result.ambiguities) {
      lines.push(`- **"${a.text}"**`);
      lines.push(`  - Suggestion: ${a.suggestion}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
