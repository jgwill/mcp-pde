# PDE-MCP Overview Specification
> Prompt Decomposition Engine as Model Context Protocol Server

**Version**: 1.0.0
**Document ID**: pde-mcp-overview-v1
**Last Updated**: 2026-01-30
**Attribution**: Indigenous-AI Collaborative Platform

## Creative Intent

### Desired Outcome
LLM terminal agents (claude-code, gemini-cli, copilot-cli) **create** well-decomposed, ceremonially-aligned execution plans from complex user prompts, enabling transparent, recoverable, multi-step workflows that honor both Western technical precision and Indigenous epistemological frameworks.

### Current Reality
Terminal agents receive complex prompts with:
- Multiple implicit intentions
- Nested requirements and action sequences
- Context requiring cross-referencing
- NCP entity relationships

Without decomposition, agents miss secondary intentions, lose context, and fail to track multi-step progress.

### Structural Tension
The natural resolution moves agents from "blind execution" to "conscious ceremony" where each task is:
1. **Understood** (East - Vision/Inquiry)
2. **Planned** (South - Growth/Learning)
3. **Validated** (West - Integration/Reflection)
4. **Completed** (North - Wisdom/Action)

## System Architecture

### 5-Layer Decomposition Pipeline

```
Layer 1: Intent Extraction & Classification
    ↓ Explicit actions, implicit requirements, intent types
Layer 2: Dependency Graph Construction
    ↓ Prerequisites, blockers, data flow, parallelization
Layer 3: Medicine Wheel Direction Assignment
    ↓ EAST/SOUTH/WEST/NORTH mapping, ceremony types
Layer 4: Workflow Template Generation
    ↓ Structured stages, tasks, checkpoints
Layer 5: Execution Plan with Checkpoints
    ↓ Agent commands, success criteria, recovery strategies
```

### MCP Integration Points

The PDE exposes capabilities through three MCP primitives:

1. **Tools** - Active operations (decompose, execute, checkpoint)
2. **Resources** - Static content (templates, ceremony definitions)
3. **Prompts** - Reusable prompt templates for each decomposition layer

## Core Concepts

### Intent Types
- **CREATION**: Generate new artifacts
- **MODIFICATION**: Update existing elements
- **ANALYSIS**: Investigate and understand
- **VALIDATION**: Verify and test
- **INTEGRATION**: Connect systems
- **COMMUNICATION**: Notifications and reports

### Medicine Wheel Directions
- **EAST** (Nitsáhákees): Vision, inquiry, exploration, initial research
- **SOUTH** (Nahat'á): Planning, learning, data gathering, analysis
- **WEST** (Iina): Integration, validation, testing, reflection
- **NORTH** (Siihasin): Wisdom, action, implementation, completion

### Ceremony Types
- **vision_inquiry**: Opening exploration (East)
- **wave_counting**: Methodical analysis (South)
- **talking_circles**: Collaborative validation (West)
- **elder_council**: Completion wisdom (North)

## Advancing Patterns

### What Users Create
1. **Transparent workflows** - Every step visible before execution
2. **Recoverable processes** - Checkpoints enable resume on failure
3. **Culturally-grounded AI** - Technology honoring Indigenous epistemology
4. **Multi-intent resolution** - Complex prompts fully understood

### Natural Progression
1. User provides complex prompt
2. PDE extracts all intents (explicit + implicit)
3. Dependencies mapped to execution graph
4. Each task assigned ceremonial direction
5. Workflow template generated with checkpoints
6. User approves/modifies plan
7. Execution proceeds with progress tracking
8. Failures recover from nearest checkpoint

## Integration with Terminal Agents

### Usage Pattern
```bash
# Decompose without executing
agent decompose "Create user auth with JWT, PostgreSQL, tests, deploy to staging"

# Execute with PDE enabled
agent chat --pde "Create user auth with JWT, PostgreSQL, tests, deploy to staging"

# Resume from checkpoint
agent resume --checkpoint stage-2-task-3
```

### Expected Outputs
```
📋 Decomposed Workflow:

Stage 1 (EAST - Vision Inquiry): Requirements Analysis
  - [ ] Extract JWT requirements from request
  - [ ] Identify PostgreSQL schema needs
  - [ ] Map testing requirements

Stage 2 (SOUTH - Wave Counting): Implementation
  [Parallel execution possible]
  - [ ] Create auth service with JWT
  - [ ] Design database schema
  - [ ] Setup test infrastructure

Stage 3 (WEST - Talking Circles): Validation
  - [ ] Run test suite
  - [ ] Verify database connections
  - [ ] Security audit of JWT implementation

Stage 4 (NORTH - Elder Council): Deployment
  - [ ] Deploy to staging environment
  - [ ] Smoke tests on staging
  - [ ] Generate deployment report
```

## Quality Criteria

### RISE Alignment
- ✅ **Creating Focus**: Users create execution plans, not solve decomposition problems
- ✅ **Structural Dynamics**: Natural flow from vision to completion
- ✅ **Advancing Patterns**: Each stage builds toward desired outcome
- ✅ **Desired Outcomes**: Clear, specific deliverables at each checkpoint

### Anti-Patterns Avoided
- ❌ Forced decomposition without understanding intent
- ❌ Ignoring cultural/ceremonial context
- ❌ Single-shot execution without checkpoints
- ❌ Opacity in workflow stages
