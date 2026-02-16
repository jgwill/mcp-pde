/**
 * PDE Prompts - System Prompt Builder for LLM-driven decomposition
 * 
 * Lineage: IAIP/lib/pde/prompts.ts → mcp-pde/src/prompts.ts
 * Constructs the system prompt that instructs the LLM to produce DecompositionResult JSON.
 */

import type { DecompositionOptions } from "./types.js";

const JSON_SCHEMA_EXAMPLE = `{
  "primary": {
    "action": "main action verb",
    "target": "what the action applies to",
    "urgency": "immediate|session|persistent",
    "confidence": 0.0-1.0
  },
  "secondary": [
    {
      "action": "action verb",
      "target": "target",
      "implicit": true/false,
      "dependency": "what this depends on or null",
      "confidence": 0.0-1.0
    }
  ],
  "context": {
    "files_needed": ["list of files"],
    "tools_required": ["list of tools"],
    "assumptions": ["list of assumptions found in prompt"]
  },
  "outputs": {
    "artifacts": ["new files to create"],
    "updates": ["existing files to update"],
    "communications": ["PRs, issues, docs to create"]
  },
  "directions": {
    "east": [{"text": "vision items", "confidence": 0.0-1.0, "implicit": false}],
    "south": [{"text": "analysis items", "confidence": 0.0-1.0, "implicit": false}],
    "west": [{"text": "validation items", "confidence": 0.0-1.0, "implicit": false}],
    "north": [{"text": "action items", "confidence": 0.0-1.0, "implicit": false}]
  },
  "actionStack": [
    {"text": "task description", "direction": "east|south|west|north", "dependency": "or null", "completed": false}
  ],
  "ambiguities": [
    {"text": "ambiguous part", "suggestion": "how to clarify"}
  ]
}`;

const DIRECTIONS_LEGEND = `Directions mapping (Medicine Wheel / Four Directions):
- EAST (🌅 Vision): Understanding what is being asked, clarifying requirements, envisioning desired outcomes
- SOUTH (🔥 Analysis): Research, learning, investigation, growth tasks
- WEST (🌊 Validation): Testing, reflection, review, accountability tasks  
- NORTH (❄️ Action): Implementation, execution, delivery, wisdom tasks`;

export function buildSystemPrompt(options: DecompositionOptions): string {
  const implicitRule = options.extractImplicit
    ? 'Extract implicit intents from phrases like "which I assume", "you will need", "somehow", "I expect", "probably", "should". Mark them with "implicit": true.'
    : "Only extract explicit intents. Set implicit to false for all.";

  const dependencyRule = options.mapDependencies
    ? "Map dependencies between actions - which tasks must complete before others can start. Use the dependency field in secondary intents and actionStack."
    : "Do not map dependencies. Set all dependency fields to null.";

  return `You are a Prompt Decomposition Engine (PDE).

CRITICAL: Your response must be ONLY a valid JSON object. Do not include:
- Markdown code fences (no \`\`\`json)
- Explanatory text before or after the JSON
- Any commentary or notes

Just output the raw JSON object starting with { and ending with }.

Analyze the user's prompt and output with this exact structure:

${JSON_SCHEMA_EXAMPLE}

${DIRECTIONS_LEGEND}

${implicitRule}
${dependencyRule}

Rules:
- Assign confidence scores (0.0-1.0) based on how clearly the intent is stated.
- Flag ambiguities where the prompt is vague, uses "somehow", "probably", "maybe", or leaves storage/method unspecified.
- Generate actionStack as an ordered list respecting dependencies, with each item mapped to a direction.
- For secondary intents, distinguish explicit (stated directly) from implicit (inferred from context, hedging language, assumptions).
- The primary intent is the single most important action. Everything else goes in secondary.
- context.assumptions should capture statements the user makes that are assumed true but not verified.

REMEMBER: Output ONLY the JSON object, nothing else.`;
}

export function formatUserMessage(prompt: string): string {
  return `Prompt to decompose:\n"${prompt}"`;
}
