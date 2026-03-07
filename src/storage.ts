/**
 * PDE Storage - .pde/ dot folder persistence
 * 
 * Stores decompositions as JSON files in .pde/ directory.
 * Exports markdown alongside JSON for human-in-the-loop editing via git diff.
 * 
 * Storage layout:
 *   .pde/
 *     <id>.json          - StoredDecomposition (full JSON)
 *     <id>.md            - Markdown export (human-editable, git-diffable)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import type {
  DecompositionResult,
  DecompositionOptions,
  StoredDecomposition,
  Direction,
} from "./types.js";
import { DIRECTION_META, DIRECTIONS } from "./types.js";
import { actionStackToMarkdown } from "./parser.js";

const PDE_DIR = ".pde";

function ensureDir(workdir: string): string {
  const dir = join(workdir, PDE_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Save a decomposition to .pde/ as JSON + Markdown.
 */
export function saveDecomposition(
  workdir: string,
  id: string,
  prompt: string,
  result: DecompositionResult,
  options: DecompositionOptions
): StoredDecomposition {
  const dir = ensureDir(workdir);
  const stored: StoredDecomposition = {
    id,
    timestamp: new Date().toISOString(),
    prompt,
    result,
    options,
  };

  // Save JSON
  const jsonPath = join(dir, `${id}.json`);
  writeFileSync(jsonPath, JSON.stringify(stored, null, 2), "utf-8");

  // Save Markdown
  const mdPath = join(dir, `${id}.md`);
  const md = decompositionToMarkdown(result, prompt);
  writeFileSync(mdPath, md, "utf-8");
  stored.markdownPath = mdPath;

  return stored;
}

/**
 * Load a decomposition from .pde/ by ID.
 */
export function loadDecomposition(workdir: string, id: string): StoredDecomposition | null {
  const jsonPath = join(workdir, PDE_DIR, `${id}.json`);
  if (!existsSync(jsonPath)) return null;
  const raw = readFileSync(jsonPath, "utf-8");
  return JSON.parse(raw) as StoredDecomposition;
}

/**
 * List all decompositions in .pde/.
 */
export function listDecompositions(workdir: string, limit?: number): StoredDecomposition[] {
  const dir = join(workdir, PDE_DIR);
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  const limited = limit ? files.slice(0, limit) : files;
  return limited.map((f) => {
    const raw = readFileSync(join(dir, f), "utf-8");
    return JSON.parse(raw) as StoredDecomposition;
  });
}

/**
 * Convert a DecompositionResult to a git-diffable Markdown document.
 * IAIP canonical format: Four Directions as first section after title,
 * centering relational/directional knowing before reductive intent extraction.
 */
export function decompositionToMarkdown(result: DecompositionResult, prompt?: string): string {
  const lines: string[] = [];

  lines.push("# Prompt Decomposition");
  lines.push("");

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
