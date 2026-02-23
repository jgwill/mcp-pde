# PDE-MCP Overview Specification
> Prompt Decomposition Engine as Model Context Protocol Server

**Version**: 2.0.0
**Document ID**: pde-mcp-overview-v2
**Last Updated**: 2026-02-22
**Attribution**: Indigenous-AI Collaborative Platform

## Creative Intent

### Desired Outcome
LLM terminal agents (claude-code, gemini-cli, copilot-cli) **create** well-decomposed, ceremonially-aligned decompositions from complex user prompts — stored as git-diffable markdown in `.pde/` — enabling transparent, human-in-the-loop review of multi-intent workflows.

### Current Reality
Terminal agents receive complex prompts with:
- Multiple implicit intentions
- Nested requirements and action sequences
- Context requiring cross-referencing
- Ambiguities that need surfacing before execution

Without decomposition, agents miss secondary intentions, lose context, and fail to track multi-step progress.

### Structural Tension
The natural resolution moves agents from "blind execution" to "conscious ceremony" where each task is:
1. **Understood** (East 🌅 — Vision: what is being asked?)
2. **Analyzed** (South 🔥 — Analysis: what needs to be learned?)
3. **Validated** (West 🌊 — Validation: what needs reflection?)
4. **Executed** (North ❄️ — Action: what executes the cycle?)

## System Architecture

### LLM-Driven Two-Step Pipeline (v2)

```
Step 1: Build Prompt
  pde_decompose(prompt) → { systemPrompt, userMessage }
      ↓ agent sends to their own LLM
  LLM → DecompositionResult JSON

Step 2: Parse & Store
  pde_parse_response(llm_response, original_prompt)
      → StoredDecomposition saved to .pde/<uuid>.json
      → Markdown export to .pde/<uuid>.md (git-diffable)
```

The engine does **not** embed an LLM. The calling agent (Copilot CLI, Gemini CLI, mia-code) feeds the system prompt to their own LLM provider.

### MCP Integration Points

The PDE exposes capabilities through three MCP primitives:

1. **Tools** — Active operations: `pde_decompose`, `pde_parse_response`, `pde_get`, `pde_list`, `pde_export_markdown`
2. **Resources** — Static content: `pde://schema/decomposition-result`, `pde://directions`
3. **Prompts** — Single reusable prompt: `pde-decompose`

### Storage Layout

```
.pde/
  <uuid>.json    — StoredDecomposition (full structured JSON)
  <uuid>.md      — Markdown export (human-editable, git-diffable)
```

## Core Concepts

### DecompositionResult Schema
Canonical output structure (from IAIP/lib/pde lineage):
- **primary**: Single most important action (action, target, urgency, confidence)
- **secondary**: All other intents, explicit and implicit
- **context**: Files needed, tools required, assumptions
- **outputs**: Artifacts, updates, communications expected
- **directions**: Items mapped to east/south/west/north
- **actionStack**: Ordered task list with direction and dependency
- **ambiguities**: Vague aspects with clarification suggestions

### Direction Mapping (Four Directions)
- **east** 🌅 VISION: Understanding what is being asked, clarifying requirements
- **south** 🔥 ANALYSIS: Research, learning, investigation, growth tasks
- **west** 🌊 VALIDATION: Testing, reflection, review, accountability tasks
- **north** ❄️ ACTION: Implementation, execution, delivery, wisdom tasks

### Lineage
- Canonical types: `IAIP/lib/pde/types.ts`
- System prompts: `IAIP/lib/pde/prompts.ts`
- Parser: `IAIP/lib/pde/parser.ts`
- Web UI reference: `IAIP/app/prompt-decomposer/page.tsx`

## Advancing Patterns

### What Users Create
1. **Structured decompositions** — Complex prompts fully understood before execution
2. **Git-diffable plans** — Markdown exports enable human review and editing
3. **Surfaced ambiguities** — Vague intent flagged for clarification
4. **Ceremonially-aligned tasks** — Four Directions organizing principle

### Natural Progression
1. Agent calls `pde_decompose` with user prompt → receives system prompt + user message
2. Agent sends messages to their LLM → receives DecompositionResult JSON
3. Agent calls `pde_parse_response` → stored in `.pde/<uuid>.json` + `.pde/<uuid>.md`
4. User reviews markdown, edits if needed; `git diff` shows changes
5. Ambiguities become discussion threads for future clarification

## Integration with Terminal Agents

### Workflow Pattern
```
# Step 1: Get decomposition prompt
pde_decompose({ prompt: "Create user auth with JWT, PostgreSQL, tests" })
→ { systemPrompt, userMessage }

# Step 2: Agent sends to LLM, gets JSON back
# Step 3: Store result
pde_parse_response({ llm_response: "<json>", original_prompt: "..." })
→ StoredDecomposition { id, timestamp, result, markdownPath }

# Step 4: Retrieve or export
pde_get({ id: "<uuid>" })
pde_export_markdown({ id: "<uuid>" })
```

### Expected Markdown Output (`.pde/<uuid>.md`)
```markdown
# Prompt Decomposition

## Directions
- 🌅 **EAST** — VISION: What is being asked?
- 🔥 **SOUTH** — ANALYSIS: What needs to be learned?
- 🌊 **WEST** — VALIDATION: What needs reflection?
- ❄️ **NORTH** — ACTION: What executes the cycle?

## Primary Intent
**Action:** create  **Target:** user auth system  **Urgency:** immediate

## Action Stack
- [ ] 🌅 Clarify JWT token lifespan (no deps)
- [ ] 🔥 Design PostgreSQL schema
- [ ] 🔥 Implement JWT auth service (depends on schema)
- [ ] 🌊 Write and run test suite
- [ ] ❄️ Deploy to staging

## Ambiguity Flags
- **"PostgreSQL"** — Suggestion: Confirm DB host / connection string
```

## Quality Criteria

### RISE Alignment
- ✅ **Creating Focus**: Agents create structured decompositions, not solve decomposition problems
- ✅ **Structural Dynamics**: Natural flow from vision to action via Four Directions
- ✅ **Advancing Patterns**: Each stored decomposition builds toward informed execution
- ✅ **Desired Outcomes**: Actionable action stack + surfaced ambiguities at each call

### Anti-Patterns Avoided
- ❌ Embedding LLM — engine builds prompts only; callers supply their own LLM
- ❌ Opacity — all decompositions persisted as human-readable markdown
- ❌ Single-shot execution — two-step workflow enables review before acting
- ❌ Lost ambiguities — explicit `ambiguities[]` array surfaces vague intent
