# PDE-MCP Data Models Specification
> TypeScript Interface Definitions for Prompt Decomposition Engine v2

**Version**: 2.0.0
**Document ID**: pde-mcp-data-models-v2

## Creative Intent

### Desired Outcome
Developers **create** type-safe implementations using the canonical IAIP/lib/pde types — a zero-dependency, reusable schema shared across MCP server, CLI, and web UI contexts.

### Lineage
All types flow from `IAIP/lib/pde/types.ts`. This file is a direct port.

## Core DecompositionResult Schema

```typescript
/**
 * Root output of a PDE decomposition.
 * Produced by the LLM when given the buildSystemPrompt() instructions.
 */
export interface DecompositionResult {
  primary: PrimaryIntent;
  secondary: SecondaryIntent[];
  context: ContextRequirements;
  outputs: ExpectedOutputs;
  directions: DirectionMap;
  actionStack: ActionItem[];
  ambiguities: AmbiguityFlag[];
}
```

### Primary Intent

```typescript
export interface PrimaryIntent {
  action: string;           // The main verb/operation
  target: string;           // What is being acted upon
  urgency: Urgency;         // "immediate" | "session" | "persistent"
  confidence: number;       // 0.0 - 1.0
}

export type Urgency = "immediate" | "session" | "persistent";
```

### Secondary Intents

```typescript
export interface SecondaryIntent {
  action: string;
  target: string;
  implicit: boolean;        // true = inferred from hedging language
  dependency: string | null; // what this intent depends on, or null
  confidence: number;        // 0.0 - 1.0
}
```

### Context Requirements

```typescript
export interface ContextRequirements {
  files_needed: string[];   // Files the agent should read before acting
  tools_required: string[]; // MCP tools or CLI tools needed
  assumptions: string[];    // Statements in the prompt assumed true but unverified
}
```

### Expected Outputs

```typescript
export interface ExpectedOutputs {
  artifacts: string[];      // New files to create
  updates: string[];        // Existing files to update
  communications: string[]; // PRs, issues, docs, notifications
}
```

### Direction Map (Four Directions)

```typescript
export type Direction = "east" | "south" | "west" | "north";

export interface DirectionItem {
  text: string;
  confidence: number;       // 0.0 - 1.0
  implicit: boolean;
}

export type DirectionMap = Record<Direction, DirectionItem[]>;
```

Direction semantics:
- **east** 🌅 VISION — What is being asked?
- **south** 🔥 ANALYSIS — What needs to be learned?
- **west** 🌊 VALIDATION — What needs reflection?
- **north** ❄️ ACTION — What executes the cycle?

### Action Stack

```typescript
export interface ActionItem {
  text: string;
  direction: Direction;     // "east" | "south" | "west" | "north"
  dependency: string | null; // Task this depends on, or null
  completed?: boolean;       // Defaults to false
}
```

The actionStack is an ordered list of tasks respecting dependencies, each mapped to a direction.

### Ambiguity Flags

```typescript
export interface AmbiguityFlag {
  text: string;       // The vague/ambiguous phrase or aspect
  suggestion: string; // How to clarify it
}
```

## Direction Metadata

```typescript
export interface DirectionMeta {
  name: string;   // "VISION" | "ANALYSIS" | "VALIDATION" | "ACTION"
  desc: string;   // Short description of what the direction handles
  emoji: string;  // "🌅" | "🔥" | "🌊" | "❄️"
  color: string;  // Hex color for visualization
}

export const DIRECTION_META: Record<Direction, DirectionMeta> = {
  east:  { name: "VISION",     desc: "What is being asked?",       emoji: "🌅", color: "#f59e0b" },
  south: { name: "ANALYSIS",   desc: "What needs to be learned?",  emoji: "🔥", color: "#ef4444" },
  west:  { name: "VALIDATION", desc: "What needs reflection?",     emoji: "🌊", color: "#3b82f6" },
  north: { name: "ACTION",     desc: "What executes the cycle?",   emoji: "❄️", color: "#10b981" },
};
```

## Storage Types

```typescript
/**
 * Persisted to .pde/<uuid>.json
 */
export interface StoredDecomposition {
  id: string;               // UUID
  timestamp: string;        // ISO 8601
  prompt: string;           // Original prompt text
  result: DecompositionResult;
  options: DecompositionOptions;
  markdownPath?: string;    // Path to .pde/<id>.md, set after export
}
```

## MCP Tool Input Types

```typescript
export interface DecompositionOptions {
  extractImplicit: boolean;   // Extract implicit intents (default: true)
  mapDependencies: boolean;   // Map dependencies between actions (default: true)
}

export interface DecomposeInput {
  prompt: string;
  options?: Partial<DecompositionOptions>;
  workdir?: string;           // Working directory for .pde/ storage
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
```
