/**
 * PDE-MCP Types v2
 * 
 * Canonical types from IAIP/lib/pde/types.ts — the LLM-driven Prompt Decomposition Engine.
 * This replaces the v1 regex-based types with the proven DecompositionResult schema
 * that powers the IAIP web UI and is designed for reuse across MCP, CLI, and UI contexts.
 * 
 * Lineage: IAIP/lib/pde/types.ts → mcp-pde/src/types.ts
 */

// ============================================================================
// Core DecompositionResult Schema (from IAIP/lib/pde)
// ============================================================================

export interface DecompositionOptions {
  extractImplicit: boolean;
  mapDependencies: boolean;
}

export const DEFAULT_OPTIONS: DecompositionOptions = {
  extractImplicit: true,
  mapDependencies: true,
};

export interface DecompositionResult {
  primary: PrimaryIntent;
  secondary: SecondaryIntent[];
  context: ContextRequirements;
  outputs: ExpectedOutputs;
  directions: DirectionMap;
  actionStack: ActionItem[];
  ambiguities: AmbiguityFlag[];
}

export interface PrimaryIntent {
  action: string;
  target: string;
  urgency: Urgency;
  confidence: number;
}

export type Urgency = "immediate" | "session" | "persistent";

export interface SecondaryIntent {
  action: string;
  target: string;
  implicit: boolean;
  dependency: string | null;
  confidence: number;
}

export interface ContextRequirements {
  files_needed: string[];
  tools_required: string[];
  assumptions: string[];
}

export interface ExpectedOutputs {
  artifacts: string[];
  updates: string[];
  communications: string[];
}

export type Direction = "east" | "south" | "west" | "north";

export interface DirectionItem {
  text: string;
  confidence: number;
  implicit: boolean;
}

export type DirectionMap = Record<Direction, DirectionItem[]>;

export interface ActionItem {
  text: string;
  direction: Direction;
  dependency: string | null;
  completed?: boolean;
}

export interface AmbiguityFlag {
  text: string;
  suggestion: string;
}

// ============================================================================
// Direction Metadata
// ============================================================================

export interface DirectionMeta {
  name: string;
  desc: string;
  emoji: string;
  color: string;
}

export const DIRECTION_META: Record<Direction, DirectionMeta> = {
  east: { name: "VISION", desc: "What is being asked?", emoji: "🌅", color: "#f59e0b" },
  south: { name: "ANALYSIS", desc: "What needs to be learned?", emoji: "🔥", color: "#ef4444" },
  west: { name: "VALIDATION", desc: "What needs reflection?", emoji: "🌊", color: "#3b82f6" },
  north: { name: "ACTION", desc: "What executes the cycle?", emoji: "❄️", color: "#10b981" },
};

export const DIRECTIONS: Direction[] = ["east", "south", "west", "north"];

// ============================================================================
// Storage Types (for .pde/ dot folder persistence)
// ============================================================================

export interface StoredDecomposition {
  id: string;
  timestamp: string;
  prompt: string;
  result: DecompositionResult;
  options: DecompositionOptions;
  /** Path to the exported markdown file, if any */
  markdownPath?: string;
}

// ============================================================================
// MCP Tool Input Types
// ============================================================================

export interface DecomposeInput {
  prompt: string;
  options?: Partial<DecompositionOptions>;
  /** Working directory for .pde/ storage. Defaults to cwd. */
  workdir?: string;
}

export interface GetDecompositionInput {
  id: string;
  workdir?: string;
}

export interface ListDecompositionsInput {
  workdir?: string;
  limit?: number;
}

export interface ExportMarkdownInput {
  id: string;
  workdir?: string;
}
