# KINSHIP

## 1. Identity and Purpose
- Name: mcp-pde (Prompt Decomposition Engine MCP Server)
- Local role in this system: MCP server that decomposes complex prompts into structured DecompositionResult JSON using LLM-driven analysis with Four Directions mapping
- What this place tends / protects: The quality of how terminal agents begin work — ensuring prompts are properly decomposed before action, that implicit intents are surfaced, ambiguities are flagged, and dependencies are mapped
- What this place offers (its gifts): `pde_decompose`, `pde_parse_response`, `pde_get`, `pde_list`, `pde_export_markdown` tools; `.pde/` storage with git-diffable markdown export

## 2. Lineage and Relations
- Ancestors (paths or systems this place comes from):
  - `/src/IAIP/lib/pde/` — Canonical types.ts, parser.ts, prompts.ts (the gold standard implementation)
  - `/src/IAIP/app/prompt-decomposer/` — Web UI that proved the approach
  - `/src/IAIP/prototypes/poe_prompt_decomposer__260211/v2/` — Original HTML prototype
- Descendants (children / submodules / subdirectories): None yet
- Siblings (peer projects or services it walks with):
  - `/src/coaia-pde/` — Earlier attempt using Structural Tension Charts methodology; needs corrective alignment to use canonical IAIP types
  - `/src/coaia-narrative/` — JSONL memory storage that `.pde/` storage pattern draws from
- Related hubs (other roots it is in strong relation with):
  - `/src/mcp-medicine-wheel/` — Four Directions ceremony tools (Redis-backed); PDE's direction mapping (EAST=Vision, SOUTH=Analysis, WEST=Validation, NORTH=Action) aligns with its ceremony protocols
  - `/src/mia-code/` — Terminal agent that should use PDE as session-start workflow for decomposing user inquiries before beginning work
  - `/src/coaia-planning/` — Action planning complement to PDE's decomposition

## 3. Human and More‑than‑Human Accountabilities
- People / roles this place is accountable to: Guillaume (jgwill), terminal agent users
- Communities / nations / organizations connected here: Indigenous-AI Collaborative Platform (IAIP/Etuaptmumk-RSM)
- More-than-human relations: The Four Directions framework carries Indigenous knowledge — this implementation must honor that by not reducing it to mere labels
- Existing covenants / consents that apply: OCAP® principles apply to any data stored through PDE that involves Indigenous knowledge

## 4. Responsibilities and Boundaries
- Responsibilities: Ensure decomposed prompts preserve user intent, surface implicit assumptions, flag genuine ambiguities, and map to Four Directions authentically
- Reciprocity: Exports markdown that humans can edit; reads git diff to understand human contributions — this is the reciprocal loop
- Boundaries and NOs: Does NOT embed an LLM — agents bring their own. Does NOT execute action stacks — it decomposes, the agent acts. Does NOT modify mcp-medicine-wheel directly.
- Special protocols: The `.pde/` folder should be git-committed for auditability

## 5. Accountability and Change Log
- Steward(s): Guillaume (jgwill)
- How and when this kinship description should be reviewed: When new integrations are added or when mia-code begins using PDE in production
- Relational change log:
  - [2026-02-13] [copilot] — v2 rewrite: replaced regex-based engine with LLM-driven decomposition using IAIP/lib/pde canonical types; added .pde/ storage, markdown export, git-diff workflow
