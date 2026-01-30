# PDE-MCP Resources Specification
> MCP Resource Definitions for Prompt Decomposition Engine

**Version**: 1.0.0
**Document ID**: pde-mcp-resources-v1

## Creative Intent

### Desired Outcome
LLM agents **access** static knowledge resources that inform decomposition decisions, including ceremony definitions, workflow templates, and intent classification schemas.

## Resource Definitions

### Resource 1: `pde://ceremonies/medicine-wheel`

**Purpose**: Medicine Wheel direction definitions and mapping criteria

**Content Type**: `application/json`

**What This Enables**: Agents create culturally-grounded task assignments

**Schema**:
```json
{
  "directions": {
    "EAST": {
      "name": "Nitsáhákees",
      "theme": "Thinking & Beginnings",
      "description": "Vision, inquiry, exploration, initial research",
      "indicators": [
        "exploratory questions",
        "visioning statements",
        "initial research requests",
        "requirement gathering"
      ],
      "ceremonyType": "vision_inquiry",
      "color": "#FFD700"
    },
    "SOUTH": {
      "name": "Nahat'á",
      "theme": "Planning & Growth",
      "description": "Organization, methodology, structural design",
      "indicators": [
        "implementation requests",
        "data gathering",
        "skill building",
        "analysis tasks"
      ],
      "ceremonyType": "wave_counting",
      "color": "#32CD32"
    },
    "WEST": {
      "name": "Iina",
      "theme": "Living & Action",
      "description": "Integration, validation, testing, reflection",
      "indicators": [
        "testing requests",
        "validation needs",
        "integration tasks",
        "reflection points"
      ],
      "ceremonyType": "talking_circles",
      "color": "#4682B4"
    },
    "NORTH": {
      "name": "Siihasin",
      "theme": "Assurance & Reflection",
      "description": "Wisdom, completion, deployment, finalization",
      "indicators": [
        "deployment requests",
        "completion tasks",
        "final reviews",
        "wisdom synthesis"
      ],
      "ceremonyType": "elder_council",
      "color": "#FFFFFF"
    }
  },
  "cyclePattern": ["EAST", "SOUTH", "WEST", "NORTH"],
  "spiralProgression": true
}
```

---

### Resource 2: `pde://schemas/intent-types`

**Purpose**: Intent classification taxonomy

**Content Type**: `application/json`

**What This Enables**: Agents create accurate intent classifications

**Schema**:
```json
{
  "intentTypes": {
    "CREATION": {
      "description": "Generate new artifacts, files, components",
      "verbs": ["create", "generate", "build", "make", "write", "design"],
      "defaultDirection": "SOUTH"
    },
    "MODIFICATION": {
      "description": "Update, change, or refactor existing elements",
      "verbs": ["update", "modify", "change", "refactor", "edit", "fix"],
      "defaultDirection": "SOUTH"
    },
    "ANALYSIS": {
      "description": "Investigate, understand, research",
      "verbs": ["analyze", "investigate", "understand", "research", "explore", "find"],
      "defaultDirection": "EAST"
    },
    "VALIDATION": {
      "description": "Verify, test, check correctness",
      "verbs": ["test", "verify", "validate", "check", "ensure", "confirm"],
      "defaultDirection": "WEST"
    },
    "INTEGRATION": {
      "description": "Connect, link, combine systems",
      "verbs": ["integrate", "connect", "link", "combine", "merge", "sync"],
      "defaultDirection": "WEST"
    },
    "COMMUNICATION": {
      "description": "Report, notify, document",
      "verbs": ["report", "notify", "document", "log", "alert", "summarize"],
      "defaultDirection": "NORTH"
    }
  }
}
```

---

### Resource 3: `pde://templates/workflow-stages`

**Purpose**: Standard workflow stage templates

**Content Type**: `application/json`

**What This Enables**: Agents create consistent, well-structured workflows

**Schema**:
```json
{
  "templates": {
    "standard-development": {
      "description": "Standard software development workflow",
      "stages": [
        {
          "direction": "EAST",
          "name": "Requirements Analysis",
          "purpose": "Extract and clarify requirements",
          "taskTypes": ["ANALYSIS", "EXPLORATION"]
        },
        {
          "direction": "SOUTH",
          "name": "Implementation",
          "purpose": "Build core functionality",
          "taskTypes": ["CREATION", "MODIFICATION"]
        },
        {
          "direction": "WEST",
          "name": "Validation",
          "purpose": "Test and validate implementation",
          "taskTypes": ["VALIDATION", "INTEGRATION"]
        },
        {
          "direction": "NORTH",
          "name": "Completion",
          "purpose": "Deploy and document",
          "taskTypes": ["COMMUNICATION", "DEPLOYMENT"]
        }
      ]
    },
    "research-workflow": {
      "description": "Research and analysis workflow",
      "stages": [
        {
          "direction": "EAST",
          "name": "Question Formation",
          "purpose": "Define research questions"
        },
        {
          "direction": "SOUTH",
          "name": "Data Collection",
          "purpose": "Gather relevant information"
        },
        {
          "direction": "WEST",
          "name": "Analysis",
          "purpose": "Analyze and synthesize findings"
        },
        {
          "direction": "NORTH",
          "name": "Synthesis",
          "purpose": "Present conclusions and wisdom"
        }
      ]
    }
  }
}
```

---

### Resource 4: `pde://templates/prompts/layer-1`

**Purpose**: Intent extraction prompt template

**Content Type**: `text/plain`

**What This Enables**: Consistent, thorough intent extraction

**Content**:
```
Analyze this user request and identify ALL intents:

"{{userPrompt}}"

For each intent, extract:
1. **Action verb**: What operation is requested?
2. **Target object**: What is being acted upon?
3. **Constraints**: Any implicit parameters or requirements?
4. **Intent type**: CREATION | MODIFICATION | ANALYSIS | VALIDATION | INTEGRATION | COMMUNICATION

Also identify IMPLICIT requirements:
- Assumptions requiring validation
- Unstated success criteria
- Dependencies on external context

Output as structured JSON:
{
  "explicitIntents": [...],
  "implicitIntents": [...],
  "ambiguities": [...]
}
```

---

### Resource 5: `pde://templates/prompts/layer-2`

**Purpose**: Dependency graph construction prompt template

**Content Type**: `text/plain`

**What This Enables**: Accurate dependency mapping

**Content**:
```
Given these classified intents:
{{intentsJson}}

Build a dependency graph:

For each intent, determine:
1. **Prerequisites**: Which intents MUST complete first?
2. **Blockers**: Which intents CANNOT run in parallel?
3. **Enablers**: Which intents enable optional paths?
4. **Data flow**: What outputs become inputs for other intents?

Notation:
- A -> B means B depends on A
- [A, B] means A and B can run in parallel

Output as adjacency list JSON:
{
  "nodes": [...],
  "edges": [...],
  "parallelGroups": [...]
}
```

---

### Resource 6: `pde://templates/prompts/layer-3`

**Purpose**: Medicine Wheel direction assignment prompt template

**Content Type**: `text/plain`

**What This Enables**: Culturally-grounded task categorization

**Content**:
```
Assign Medicine Wheel directions to each intent:

Intents: {{intentsJson}}

Direction criteria:
- **EAST**: Exploratory, question-forming, visioning, initial research
- **SOUTH**: Learning-focused, data gathering, skill building, analysis, implementation
- **WEST**: Integrative, validation, testing, reflection, refinement
- **NORTH**: Action-completing, implementation, deployment, finalization

For each intent, provide:
- Primary direction (main epistemological mode)
- Secondary direction (supporting mode, if applicable)
- Ceremony type: vision_inquiry | wave_counting | talking_circles | elder_council
- Rationale (why this direction fits)

Output as JSON array.
```

## Resource Access Patterns

### URI Scheme
All resources use the `pde://` scheme:
- `pde://ceremonies/*` - Ceremonial framework definitions
- `pde://schemas/*` - Data structure schemas
- `pde://templates/*` - Reusable templates

### Caching
Resources are static and can be cached indefinitely by agents.

### Versioning
Resources include version metadata in their content for compatibility checking.
