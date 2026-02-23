# PDE-MCP Resources Specification
> MCP Resource Definitions for Prompt Decomposition Engine v2

**Version**: 2.0.0
**Document ID**: pde-mcp-resources-v2

## Creative Intent

### Desired Outcome
LLM agents **access** two static resources that expose the canonical DecompositionResult schema and Four Directions metadata — enabling agents to understand the expected output format and direction semantics.

## Resource Definitions

### Resource 1: `pde://schema/decomposition-result`

**Purpose**: The canonical JSON schema for prompt decomposition output

**Content Type**: `application/json`

**What This Enables**: Agents understand the exact structure they need to parse and store after calling their LLM with the `pde-decompose` system prompt.

**Schema**:
```json
{
  "description": "DecompositionResult — the output of PDE prompt decomposition",
  "schema": {
    "primary": {
      "action": "string",
      "target": "string",
      "urgency": "immediate|session|persistent",
      "confidence": "0.0-1.0"
    },
    "secondary": [{
      "action": "string",
      "target": "string",
      "implicit": "boolean",
      "dependency": "string|null",
      "confidence": "0.0-1.0"
    }],
    "context": {
      "files_needed": ["string"],
      "tools_required": ["string"],
      "assumptions": ["string"]
    },
    "outputs": {
      "artifacts": ["string"],
      "updates": ["string"],
      "communications": ["string"]
    },
    "directions": {
      "east":  [{"text": "string", "confidence": "0.0-1.0", "implicit": "boolean"}],
      "south": [{"text": "string", "confidence": "0.0-1.0", "implicit": "boolean"}],
      "west":  [{"text": "string", "confidence": "0.0-1.0", "implicit": "boolean"}],
      "north": [{"text": "string", "confidence": "0.0-1.0", "implicit": "boolean"}]
    },
    "actionStack": [{
      "text": "string",
      "direction": "east|south|west|north",
      "dependency": "string|null",
      "completed": "boolean"
    }],
    "ambiguities": [{
      "text": "string",
      "suggestion": "string"
    }]
  }
}
```

---

### Resource 2: `pde://directions`

**Purpose**: Four Directions metadata for Medicine Wheel direction semantics

**Content Type**: `application/json`

**What This Enables**: Agents create accurate direction assignments and render direction-aware UI (colors, emojis, descriptions).

**Schema** (matches `DIRECTION_META` constant in `types.ts`):
```json
{
  "east":  { "name": "VISION",     "desc": "What is being asked?",      "emoji": "🌅", "color": "#f59e0b" },
  "south": { "name": "ANALYSIS",   "desc": "What needs to be learned?", "emoji": "🔥", "color": "#ef4444" },
  "west":  { "name": "VALIDATION", "desc": "What needs reflection?",    "emoji": "🌊", "color": "#3b82f6" },
  "north": { "name": "ACTION",     "desc": "What executes the cycle?",  "emoji": "❄️", "color": "#10b981" }
}
```

## Resource Access Patterns

### URI Scheme
Resources use the `pde://` scheme:
- `pde://schema/decomposition-result` — DecompositionResult JSON schema
- `pde://directions` — Four Directions metadata

### Caching
Resources are static (derived from compile-time constants) and can be cached indefinitely.

### Versioning
Resource content reflects the v2 `DecompositionResult` schema (lowercase directions: east/south/west/north). Earlier v1 specs used uppercase EAST/SOUTH/WEST/NORTH — these are no longer used.
