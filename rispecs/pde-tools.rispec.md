# PDE-MCP Tools Specification
> MCP Tool Definitions for Prompt Decomposition Engine v2

**Version**: 2.0.0
**Document ID**: pde-mcp-tools-v2

## Creative Intent

### Desired Outcome
LLM agents **create** structured decompositions of complex prompts through a two-step LLM-driven workflow: first building a system prompt, then parsing and persisting the LLM response.

## Two-Step Workflow

```
pde_decompose(prompt) → { systemPrompt, userMessage }
  ↓ agent sends to LLM
pde_parse_response(llm_response, original_prompt) → StoredDecomposition
```

## Tool Definitions

### Tool 1: `pde_decompose`

**Purpose**: Build system prompt + user message for LLM-driven prompt decomposition

**What Users Create**: A ready-to-send LLM payload that produces a DecompositionResult JSON

**Input Schema**:
```typescript
interface DecomposeInput {
  prompt: string;          // The complex prompt to decompose
  options?: {
    extractImplicit?: boolean;  // Extract implicit intents (default: true)
    mapDependencies?: boolean;  // Map dependencies between actions (default: true)
  };
}
```

**Output** (JSON):
```typescript
{
  instructions: string;    // "Send systemPrompt + userMessage to your LLM, then call pde_parse_response"
  systemPrompt: string;    // Full system prompt instructing LLM to produce DecompositionResult JSON
  userMessage: string;     // Formatted user message: 'Prompt to decompose: "<prompt>"'
  original_prompt: string; // Echo of the original prompt
}
```

**Behavior**:
1. Merges options with defaults (`extractImplicit: true`, `mapDependencies: true`)
2. Builds system prompt via `buildSystemPrompt(opts)`
3. Returns both messages — does NOT call any LLM itself

---

### Tool 2: `pde_parse_response`

**Purpose**: Parse an LLM response into a structured DecompositionResult and persist it to `.pde/`

**What Users Create**: A stored decomposition as `.pde/<uuid>.json` + `.pde/<uuid>.md`

**Input Schema**:
```typescript
interface ParseResponseInput {
  llm_response: string;    // Raw LLM response text containing DecompositionResult JSON
  original_prompt: string; // The original prompt that was decomposed
  workdir?: string;        // Working directory for .pde/ storage (defaults to cwd)
  options?: {
    extractImplicit?: boolean;
    mapDependencies?: boolean;
  };
}
```

**Output** (`StoredDecomposition`):
```typescript
interface StoredDecomposition {
  id: string;              // UUID
  timestamp: string;       // ISO timestamp
  prompt: string;          // Original prompt
  result: DecompositionResult;
  options: DecompositionOptions;
  markdownPath?: string;   // Path to .pde/<id>.md
}
```

**Behavior**:
1. Calls `parseDecompositionResponse(llm_response)` — handles markdown code fences, raw JSON, substring extraction
2. Generates UUID
3. Saves to `.pde/<uuid>.json` (full StoredDecomposition)
4. Exports `.pde/<uuid>.md` (git-diffable markdown with Four Directions headers)
5. Returns the full StoredDecomposition

---

### Tool 3: `pde_get`

**Purpose**: Retrieve a stored decomposition by ID from `.pde/`

**What Users Create**: Access to a previously stored decomposition for review or re-export

**Input Schema**:
```typescript
interface GetDecompositionInput {
  id: string;       // Decomposition UUID
  workdir?: string; // Working directory
}
```

**Output**: Full `StoredDecomposition` JSON, or error if not found

---

### Tool 4: `pde_list`

**Purpose**: List stored decompositions from `.pde/`

**What Users Create**: Visibility into decomposition history

**Input Schema**:
```typescript
interface ListDecompositionsInput {
  workdir?: string;
  limit?: number;   // Default: 10
}
```

**Output** (summary array):
```typescript
Array<{
  id: string;
  timestamp: string;
  primaryAction: string;       // "action target" from primary intent
  secondaryCount: number;
  ambiguityCount: number;
  actionStackCount: number;
}>
```

---

### Tool 5: `pde_export_markdown`

**Purpose**: Export a stored decomposition as a git-diffable markdown document with Four Directions headers

**What Users Create**: A human-readable, editable document committed alongside code

**Input Schema**:
```typescript
interface ExportMarkdownInput {
  id: string;       // Decomposition UUID
  workdir?: string;
}
```

**Output**: Markdown string with structure:
```
# Prompt Decomposition
## Directions          — Four Directions header block
## Original Prompt
## Primary Intent
## Secondary Intents
## Context Requirements
## Four Directions Analysis
## Action Stack        — ordered checklist with direction + dependency
## Ambiguity Flags
## Expected Outputs
```

**Note**: The markdown is also auto-written to `.pde/<id>.md` during `pde_parse_response`. This tool re-generates it on demand.

## Error Handling

Each tool returns `{ isError: true, content: [{ text: "..." }] }` on failure:

- **Missing required parameter**: `"Missing required parameter: prompt"`
- **Decomposition not found**: `"Decomposition <id> not found"`
- **Parse failure**: Thrown as `PDEParseError` with description of what failed
- **General errors**: Caught and returned as `"Error: <message>"`
