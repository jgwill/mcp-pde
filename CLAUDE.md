# CLAUDE

## PDE MCP Server v2

This is the **Prompt Decomposition Engine** MCP server, rebuilt using the canonical `IAIP/lib/pde` types and LLM-driven system prompts.

### Architecture

- **types.ts** — Canonical `DecompositionResult` schema (from IAIP/lib/pde/types.ts). Zero-dependency. Defines: PrimaryIntent, SecondaryIntent, ContextRequirements, DirectionMap (Four Directions), ActionStack, AmbiguityFlags.
- **prompts.ts** — System prompt builder that instructs any LLM to produce the DecompositionResult JSON. Configurable for implicit extraction and dependency mapping.
- **parser.ts** — Parses LLM text responses into validated DecompositionResult. Handles markdown code blocks, raw JSON, substring extraction.
- **storage.ts** — Persists decompositions to `.pde/` dot folder as JSON + Markdown. The markdown export is git-diffable for human-in-the-loop editing.
- **pde-engine.ts** — Orchestrates prompt building, response parsing, and storage. Does NOT embed an LLM — the calling agent sends the prompt to their own LLM.
- **mcp-server.ts** — MCP tools, resources, and prompts.

### MCP Tools

1. `pde_decompose` — Build system prompt + user message. Agent sends to LLM, gets back JSON.
2. `pde_parse_response` — Parse the LLM JSON response and store in .pde/.
3. `pde_get` — Retrieve stored decomposition by ID.
4. `pde_list` — List stored decompositions.
5. `pde_export_markdown` — Export as markdown with Four Directions headers.

### Workflow for Terminal Agents

1. Agent calls `pde_decompose` with user prompt → gets system prompt + user message
2. Agent sends these to their LLM → gets DecompositionResult JSON
3. Agent calls `pde_parse_response` → stores in `.pde/<uuid>.json` + `.pde/<uuid>.md`
4. Agent can commit the markdown, user edits it, agent reads `git diff` to understand contributions
5. `ambiguities` array becomes sources for future discussion threads

### Lineage

- Canonical types: `IAIP/lib/pde/types.ts`
- System prompts: `IAIP/lib/pde/prompts.ts`
- Parser: `IAIP/lib/pde/parser.ts`
- Web UI reference: `IAIP/app/prompt-decomposer/page.tsx`
- Prototype: `IAIP/prototypes/poe_prompt_decomposer__260211/v2/index.html`

### Related Projects

- `coaia-pde/` — Earlier attempt with STC methodology, needs corrective alignment
- `mcp-medicine-wheel/` — Four Directions ceremony tools (Redis-backed), future PDE integration
- `mia-code/` — Terminal agent that will use PDE as session-start workflow



