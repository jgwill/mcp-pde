# PDE-MCP Prompts Specification
> MCP Prompt Template Definitions for Prompt Decomposition Engine v2

**Version**: 2.0.0
**Document ID**: pde-mcp-prompts-v2

## Creative Intent

### Desired Outcome
LLM agents **access** a single reusable prompt template (`pde-decompose`) that produces a complete `DecompositionResult` JSON in one LLM call, replacing the v1 five-layer chained approach.

## Prompt Definitions

### Prompt 1: `pde-decompose`

**Purpose**: System prompt for LLM-driven prompt decomposition — instructs the LLM to output a `DecompositionResult` JSON object in a single call.

**What This Enables**: Any LLM (Claude, Gemini, GPT) produces a structured, consistent decomposition regardless of provider.

**Arguments**:
```typescript
{
  userPrompt: string;          // Required: The prompt to decompose
  extractImplicit?: string;    // "true" (default) | "false"
  mapDependencies?: string;    // "true" (default) | "false"
}
```

**System Prompt Structure**:
```
You are a Prompt Decomposition Engine (PDE).

CRITICAL: Your response must be ONLY a valid JSON object. Do not include:
- Markdown code fences (no ```json)
- Explanatory text before or after the JSON
- Any commentary or notes

Just output the raw JSON object starting with { and ending with }.

Analyze the user's prompt and output with this exact structure:
<JSON_SCHEMA_EXAMPLE>

Directions mapping (Medicine Wheel / Four Directions):
- EAST (🌅 Vision): Understanding what is being asked, clarifying requirements, envisioning desired outcomes
- SOUTH (🔥 Analysis): Research, learning, investigation, growth tasks
- WEST (🌊 Validation): Testing, reflection, review, accountability tasks
- NORTH (❄️ Action): Implementation, execution, delivery, wisdom tasks

[extractImplicit rule: extract implicit intents from hedging language OR only explicit intents]
[mapDependencies rule: map dependency fields OR set all to null]

Rules:
- Assign confidence scores (0.0-1.0) based on how clearly the intent is stated.
- Flag ambiguities where the prompt uses "somehow", "probably", "maybe", or leaves method unspecified.
- Generate actionStack as an ordered list respecting dependencies, each item mapped to a direction.
- For secondary intents, distinguish explicit from implicit.
- The primary intent is the single most important action.
- context.assumptions captures statements assumed true but not verified.
```

**User Message Format**:
```
Prompt to decompose:
"<userPrompt>"
```

**Expected JSON Output** (DecompositionResult schema):
```json
{
  "primary": {
    "action": "main action verb",
    "target": "what the action applies to",
    "urgency": "immediate|session|persistent",
    "confidence": 0.95
  },
  "secondary": [
    {
      "action": "action verb",
      "target": "target",
      "implicit": false,
      "dependency": "what this depends on or null",
      "confidence": 0.8
    }
  ],
  "context": {
    "files_needed": ["list of files"],
    "tools_required": ["list of tools"],
    "assumptions": ["statements assumed true"]
  },
  "outputs": {
    "artifacts": ["new files to create"],
    "updates": ["existing files to update"],
    "communications": ["PRs, issues, docs"]
  },
  "directions": {
    "east":  [{"text": "vision items",     "confidence": 0.9, "implicit": false}],
    "south": [{"text": "analysis items",   "confidence": 0.8, "implicit": false}],
    "west":  [{"text": "validation items", "confidence": 0.7, "implicit": true}],
    "north": [{"text": "action items",     "confidence": 0.9, "implicit": false}]
  },
  "actionStack": [
    {"text": "task description", "direction": "east", "dependency": null,          "completed": false},
    {"text": "next task",        "direction": "south", "dependency": "prior task", "completed": false}
  ],
  "ambiguities": [
    {"text": "ambiguous part", "suggestion": "how to clarify"}
  ]
}
```

## Prompt Access via MCP

### Via `GetPrompt` (MCP prompt primitive)
```
name: pde-decompose
arguments:
  userPrompt: "Create user auth with JWT, PostgreSQL, tests, deploy to staging"
  extractImplicit: "true"
  mapDependencies: "true"
```

Returns a `messages` array with a single user message combining system prompt + user message.

### Via `pde_decompose` Tool (preferred for agents)
The `pde_decompose` tool is the preferred access pattern — it returns `systemPrompt` and `userMessage` separately, so the calling agent can send them as proper system/user roles to their LLM provider.

```
pde_decompose({ prompt: "...", options: { extractImplicit: true, mapDependencies: true } })
→ {
    instructions: "Send systemPrompt as system message...",
    systemPrompt: "You are a Prompt Decomposition Engine...",
    userMessage: 'Prompt to decompose:\n"..."',
    original_prompt: "..."
  }
```

## Options Behavior

| Option | Default | Effect |
|--------|---------|--------|
| `extractImplicit: true` | ✅ | Extracts implicit intents from hedging language ("which I assume", "you will need", "somehow", "I expect", "probably", "should"). Marks them `implicit: true`. |
| `extractImplicit: false` | — | Only explicit intents. All `implicit: false`. |
| `mapDependencies: true` | ✅ | Maps `dependency` fields in secondary intents and actionStack to show ordering requirements. |
| `mapDependencies: false` | — | All `dependency` fields set to `null`. |
