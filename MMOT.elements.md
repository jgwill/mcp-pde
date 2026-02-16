# MMOT Elements — PDE Quality Criteria

> Managerial Moment of Truth elements for evaluating whether a Prompt Decomposition Engine iteration delivers acceptable results.

## What We Want (Desired Outcomes)

1. **Primary Intent Extraction** — The decomposition correctly identifies the single most important action from the user's prompt with appropriate confidence scoring
2. **Implicit Intent Surfacing** — Hedging language ("I assume", "somehow", "probably", "you will need") is detected and flagged as implicit secondary intents, not ignored
3. **Ambiguity Detection** — Vague or underspecified parts of the prompt are explicitly flagged with actionable suggestions for clarification
4. **Four Directions Mapping** — Action items are mapped to EAST (Vision), SOUTH (Analysis), WEST (Validation), NORTH (Action) based on their nature, not arbitrarily
5. **Dependency Tracking** — The action stack respects dependencies between tasks, so agents don't attempt work before prerequisites are met
6. **Context Requirements** — Files needed, tools required, and assumptions are explicitly listed so agents can verify readiness before starting
7. **Human-in-the-Loop** — Markdown export is readable by humans, git-diffable, and the LLM can read user edits back via diff to understand human contributions
8. **Storage Persistence** — Decompositions survive server restarts via `.pde/` dot folder storage (not in-memory only)

## How We Decide (Evaluation Criteria)

| Element | Acceptable | Not Acceptable |
|---------|-----------|----------------|
| Primary intent | Correct action verb + target extracted with confidence ≥ 0.7 | Wrong verb, missing target, or confidence below 0.5 |
| Implicit intents | All hedging language phrases detected and marked `implicit: true` | Hedging phrases ignored or treated as explicit |
| Ambiguities | Genuinely vague parts flagged (not obvious things); suggestions are actionable | No ambiguities detected on a genuinely ambiguous prompt, or false positives on clear statements |
| Direction mapping | Actions mapped to correct quadrant (vision→east, analysis→south, reflection→west, execution→north) | Random or all-same-direction mapping |
| Dependencies | Dependent tasks reference their prerequisites; no circular dependencies | All dependencies null, or circular references |
| Context | Files/tools listed match what the prompt references | Empty context on a prompt that clearly names files |
| Markdown export | Readable, has Four Directions headers, human can edit and git-diff | Malformed markdown or missing sections |
| Storage | `.pde/<uuid>.json` and `.pde/<uuid>.md` created on disk | In-memory only, lost on restart |

## When We Evaluate

- After each `pde_parse_response` call: spot-check the result against these criteria
- After a human edits the markdown and the diff is read: verify the LLM correctly interprets changes
- When integrating into mia-code: verify end-to-end workflow (prompt → decompose → store → user-edit → diff-read)

## Current Status

- **v1 (mcp-pde original)**: Not Acceptable — regex-only, no LLM, in-memory storage, no ambiguity detection
- **v1 (coaia-pde)**: Not Acceptable — crude verb matching, no confidence scoring, no tests
- **v2 (mcp-pde rebuilt)**: Structurally Acceptable — uses LLM prompts, has storage, has markdown export. Needs integration testing with real LLM responses.
