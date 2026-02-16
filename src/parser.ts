/**
 * PDE Parser - Response Parser for LLM text → DecompositionResult
 * 
 * Lineage: IAIP/lib/pde/parser.ts → mcp-pde/src/parser.ts
 * Handles JSON extraction from markdown code blocks, raw JSON, etc.
 */

import type { DecompositionResult } from "./types.js";

export class PDEParseError extends Error {
  constructor(
    message: string,
    public rawResponse: string,
    public parseAttempt?: string
  ) {
    super(message);
    this.name = "PDEParseError";
  }
}

function extractJsonString(responseText: string): string {
  const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const trimmed = responseText.trim();
  if (trimmed.startsWith("{")) return trimmed;

  const firstBrace = responseText.indexOf("{");
  const lastBrace = responseText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return responseText.substring(firstBrace, lastBrace + 1);
  }

  throw new PDEParseError("No JSON found in LLM response", responseText);
}

function normalizeResult(raw: Record<string, unknown>): DecompositionResult {
  const primary = raw.primary as DecompositionResult["primary"];
  if (!primary || !primary.action || !primary.target) {
    throw new PDEParseError("Missing or invalid 'primary' field", JSON.stringify(raw));
  }
  if (typeof primary.confidence !== "number") primary.confidence = 0.8;
  if (!primary.urgency) primary.urgency = "session";

  const ensureArray = <T>(val: unknown): T[] => Array.isArray(val) ? val : [];

  const context = (raw.context || {}) as Record<string, unknown>;
  const outputs = (raw.outputs || {}) as Record<string, unknown>;
  const directions = (raw.directions || {}) as Record<string, unknown>;

  return {
    primary,
    secondary: ensureArray(raw.secondary),
    context: {
      files_needed: ensureArray(context.files_needed),
      tools_required: ensureArray(context.tools_required),
      assumptions: ensureArray(context.assumptions),
    },
    outputs: {
      artifacts: ensureArray(outputs.artifacts),
      updates: ensureArray(outputs.updates),
      communications: ensureArray(outputs.communications),
    },
    directions: {
      east: ensureArray(directions.east),
      south: ensureArray(directions.south),
      west: ensureArray(directions.west),
      north: ensureArray(directions.north),
    },
    actionStack: ensureArray(raw.actionStack),
    ambiguities: ensureArray(raw.ambiguities),
  };
}

export function parseDecompositionResponse(responseText: string): DecompositionResult {
  const jsonString = extractJsonString(responseText);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new PDEParseError(`Invalid JSON: ${(e as Error).message}`, responseText, jsonString);
  }
  return normalizeResult(parsed);
}

export function actionStackToMarkdown(
  items: Array<{ text: string; completed?: boolean; dependency?: string | null }>
): string {
  return items
    .map((item) =>
      `- [${item.completed ? "x" : " "}] ${item.text}${
        item.dependency ? ` (depends on: ${item.dependency})` : ""
      }`
    )
    .join("\n");
}
