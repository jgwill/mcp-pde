# PDE-MCP: Prompt Decomposition Engine

> A Model Context Protocol (MCP) server that transforms complex prompts into ceremonially-aligned execution plans.

## Overview

PDE-MCP enables LLM terminal agents to decompose complex user requests into structured, executable workflows following the Medicine Wheel ceremonial framework. It honors both Western technical precision and Indigenous epistemological frameworks.

## Features

- **5-Layer Decomposition Pipeline**: Intent extraction → Dependency analysis → Wheel assignment → Workflow generation → Execution planning
- **Medicine Wheel Alignment**: Tasks organized by the Four Directions (EAST/SOUTH/WEST/NORTH)
- **Dependency Resolution**: Automatic ordering and parallelization detection
- **Checkpoint Recovery**: Resume workflows from failure points
- **MCP Integration**: Works with any MCP-compatible agent

## Installation

```bash
npm install
npm run build
```

## Usage

### As MCP Server

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "pde": {
      "command": "node",
      "args": ["/path/to/mcp-pde/dist/index.js"]
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `pde_decompose` | Decompose a complex prompt into execution plan |
| `pde_get_plan` | Retrieve a stored execution plan |
| `pde_validate_plan` | Validate plan coherence and completeness |
| `pde_get_checkpoint` | Get checkpoint for workflow recovery |
| `pde_list_workflows` | List all workflows |

### Available Resources

| URI | Description |
|-----|-------------|
| `pde://ceremonies/medicine-wheel` | Four Directions definitions |
| `pde://schemas/intent-types` | Intent classification schema |
| `pde://templates/workflow-stages` | Workflow stage templates |

### Available Prompts

| Prompt | Purpose |
|--------|---------|
| `pde-intent-extraction` | Guide Layer 1 intent extraction |
| `pde-dependency-analysis` | Guide Layer 2 dependency mapping |
| `pde-wheel-assignment` | Guide Layer 3 direction assignment |
| `pde-workflow-generation` | Guide Layer 4 workflow creation |
| `pde-execution-plan` | Guide Layer 5 plan finalization |

## Example

```
Input: "Create a REST API with JWT authentication, connect to PostgreSQL, write tests, deploy to staging"

Output:
📋 Decomposed Workflow:

Stage: SOUTH - Planning & Growth
  [Parallel execution possible]
  - [ ] Create REST API structure
  - [ ] Implement JWT authentication

Stage: WEST - Living & Action
  - [ ] Connect to PostgreSQL database
  - [ ] Write comprehensive tests

Stage: NORTH - Assurance & Reflection
  - [ ] Deploy to staging environment
```

## Medicine Wheel Framework

| Direction | Name | Theme | Intent Types |
|-----------|------|-------|--------------|
| EAST | Nitsáhákees | Thinking & Beginnings | ANALYSIS |
| SOUTH | Nahat'á | Planning & Growth | CREATION, MODIFICATION |
| WEST | Iina | Living & Action | VALIDATION, INTEGRATION |
| NORTH | Siihasin | Assurance & Reflection | COMMUNICATION |

## Testing

```bash
# Run unit tests
npm run test

# Run scenario tests
./run-scenarios.sh

# Run specific scenario
./run-scenarios.sh 01
```

## Project Structure

```
mcp-pde/
├── src/
│   ├── index.ts          # Entry point
│   ├── mcp-server.ts     # MCP server implementation
│   ├── pde-engine.ts     # 5-layer decomposition engine
│   └── types.ts          # TypeScript interfaces
├── tests/
│   ├── pde-engine.test.ts
│   └── mcp-tools.test.ts
├── scenarios/
│   ├── 01-simple-decomposition.md
│   ├── 02-multi-intent-workflow.md
│   ├── 03-ceremonial-alignment.md
│   ├── 04-dependency-resolution.md
│   └── 05-checkpoint-recovery.md
├── rispecs/              # RISE specifications
│   ├── pde-overview.rispec.md
│   ├── pde-tools.rispec.md
│   ├── pde-resources.rispec.md
│   ├── pde-prompts.rispec.md
│   └── pde-data-models.rispec.md
├── mcp-config.json       # Example MCP configuration
├── run-scenarios.sh      # Scenario test runner
└── package.json
```

## RISE Framework

This project was developed using the RISE Framework:
- **R**everse-engineer: Analyze PDE concepts from CONTENT.md
- **I**ntent-extract: Clarify desired outcomes and user needs
- **S**pecify: Create rispecs before implementation
- **E**xport: Build production-ready MCP server

## License

MIT

## Attribution

Part of the Indigenous-AI Collaborative Platform (IAIP), honoring Two-Eyed Seeing (Etuaptmumk) and sacred technology practice.
