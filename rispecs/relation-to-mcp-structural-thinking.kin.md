# Relation to mcp-structural-thinking

> Kinship document describing the envisioned relationship between **mcp-pde** (Prompt Decomposition Engine) and **mcp-structural-thinking** (Structural Thinking diagnostic layer).

## The Relationship

**mcp-pde** decomposes complex prompts into structured `DecompositionResult` objects with actions mapped to Four Directions (EAST/SOUTH/WEST/NORTH). **mcp-structural-thinking** validates the *quality* of those decompositions through structural observation, question generation, and three-universe consensus.

Together they form a **decompose → validate** pair:

```
User Prompt
    │
    ▼
mcp-pde (pde_decompose → pde_parse_response)
    │ DecompositionResult
    ▼
mcp-structural-thinking (structural_thinking_observe → validate_three_universe)
    │ Validated DecompositionResult + Questions
    ▼
Agent proceeds with confidence (or returns to user with questions)
```

## Shared Vocabulary

The Four Directions mapping aligns between both projects:

| Direction | mcp-pde Action Type | mcp-structural-thinking Question Type |
|-----------|--------------------|------------------------------------|
| 🌅 EAST | Vision / Intent actions | Information questions |
| 🔥 SOUTH | Analysis / Research actions | Clarification questions |
| 🌊 WEST | Validation / Reflection actions | Implication questions |
| ❄️ NORTH | Execution / Action items | Discrepancy questions |

## Envisioned Workflow

1. Agent receives complex user prompt
2. Agent calls `mcp-pde.pde_decompose(prompt)` → gets systemPrompt + userMessage
3. LLM processes → agent calls `mcp-pde.pde_parse_response(llm_response)` → DecompositionResult stored in `.pde/`
4. Agent calls `mcp-structural-thinking.structural_thinking_observe(decomposition_text)` → gets questions and pattern detection
5. Agent calls `mcp-structural-thinking.detect_reactive_patterns(decomposition_text)` → checks for reactive framing in the decomposition
6. Agent calls `mcp-structural-thinking.validate_three_universe(decomposition_text)` → gets three-universe consensus
7. If reactive score > moderate OR consensus FALSE OR questions reveal gaps → agent asks user for clarification before proceeding
8. If clean → agent proceeds to execute actions with structural confidence

## What mcp-pde Offers to mcp-structural-thinking

- **DecompositionResult JSON** — structured material for observation (explicit actions, directions, dependencies)
- **Four Directions mapping** — shared directional vocabulary
- **`.pde/` storage** — persistent decompositions that can be re-validated

## What mcp-structural-thinking Offers to mcp-pde

- **Quality gate** — validation that decompositions maintain creative orientation
- **Question generation** — reveals gaps in decompositions before execution
- **Reactive pattern detection** — catches problem-solving framing in action descriptions
- **Three-universe consensus** — multi-lens validation of decomposition quality

## Accountability

- Changes to mcp-pde's DecompositionResult schema should be reviewed for impact on mcp-structural-thinking's observation and validation tools
- Changes to mcp-structural-thinking's question type taxonomy should remain aligned with mcp-pde's Four Directions mapping

---

*Created: 2026-03-31 | Steward: Guillaume (jgwill)*
