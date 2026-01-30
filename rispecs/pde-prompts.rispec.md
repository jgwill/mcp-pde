# PDE-MCP Prompts Specification
> MCP Prompt Template Definitions for Prompt Decomposition Engine

**Version**: 1.0.0
**Document ID**: pde-mcp-prompts-v1

## Creative Intent

### Desired Outcome
LLM agents **access** reusable prompt templates that guide each layer of the decomposition pipeline, ensuring consistent, high-quality decomposition regardless of the host LLM.

## Prompt Definitions

### Prompt 1: `pde-intent-extraction`

**Purpose**: Guide Layer 1 intent extraction

**What This Enables**: Comprehensive capture of explicit and implicit user intentions

**Arguments**:
```typescript
{
  userPrompt: string;       // Raw prompt to analyze
  contextFiles?: string[];  // Relevant file context
}
```

**Template**:
```
You are an intent extraction specialist. Analyze the following user request with precision and thoroughness.

## User Request
"{{userPrompt}}"

{{#if contextFiles}}
## Context Files
{{#each contextFiles}}
- {{this}}
{{/each}}
{{/if}}

## Your Task

### Step 1: Explicit Intent Identification
For each explicit action in the request, extract:
- **Action**: The verb/operation requested
- **Target**: What is being acted upon
- **Parameters**: Any specified constraints or values
- **Priority**: primary | secondary | optional

### Step 2: Implicit Intent Discovery
Identify hidden requirements signaled by:
- "which I assume" → assumptions requiring validation
- "you will" → expectations without explicit instruction
- "somehow" → uncertainty markers needing clarification
- "I expect" → unstated success criteria

### Step 3: Intent Classification
Classify each intent:
- CREATION: Generate new artifacts
- MODIFICATION: Update existing elements
- ANALYSIS: Investigate/understand
- VALIDATION: Verify/test
- INTEGRATION: Connect systems
- COMMUNICATION: Report/document

### Step 4: Ambiguity Detection
Flag any aspects that are:
- Underspecified (need more information)
- Conflicting (contradictory requirements)
- Dependent on unknown context

## Output Format
```json
{
  "explicitIntents": [
    {
      "id": "intent-1",
      "action": "...",
      "target": "...",
      "parameters": {...},
      "type": "CREATION",
      "priority": "primary"
    }
  ],
  "implicitIntents": [
    {
      "id": "implicit-1",
      "description": "...",
      "triggerPhrase": "...",
      "type": "...",
      "priority": "..."
    }
  ],
  "ambiguities": [
    {
      "aspect": "...",
      "issue": "...",
      "suggestedClarification": "..."
    }
  ]
}
```
```

---

### Prompt 2: `pde-dependency-analysis`

**Purpose**: Guide Layer 2 dependency graph construction

**What This Enables**: Accurate execution ordering and parallelization

**Arguments**:
```typescript
{
  intents: Intent[];  // Extracted intents from Layer 1
}
```

**Template**:
```
You are a dependency analysis specialist. Given a set of intents, construct an execution dependency graph.

## Intents to Analyze
{{intentsJson}}

## Analysis Framework

### Step 1: Data Flow Analysis
For each intent, identify:
- **Inputs required**: What data/artifacts does this need?
- **Outputs produced**: What does this create/modify?
- **State dependencies**: What system state must exist?

### Step 2: Temporal Dependencies
Determine ordering constraints:
- **Must-precede**: Intent A MUST complete before Intent B
- **Must-follow**: Intent A MUST happen after Intent B
- **No constraint**: Can execute independently

### Step 3: Parallelization Opportunities
Identify intents that can execute simultaneously:
- No shared resource conflicts
- No data dependencies between them
- Independent failure domains

### Step 4: Critical Path Analysis
Identify the longest chain of dependent intents (critical path).

## Output Format
```json
{
  "nodes": [
    {
      "id": "intent-1",
      "inputs": ["..."],
      "outputs": ["..."]
    }
  ],
  "edges": [
    {
      "from": "intent-1",
      "to": "intent-2",
      "type": "must-precede",
      "reason": "..."
    }
  ],
  "parallelGroups": [
    ["intent-1", "intent-3"],
    ["intent-2"]
  ],
  "criticalPath": ["intent-1", "intent-2", "intent-4"],
  "hasCycles": false
}
```
```

---

### Prompt 3: `pde-wheel-assignment`

**Purpose**: Guide Layer 3 Medicine Wheel direction assignment

**What This Enables**: Culturally-grounded, ceremonially-aligned task organization

**Arguments**:
```typescript
{
  intents: Intent[];
  dependencyGraph: DependencyGraph;
}
```

**Template**:
```
You are a ceremonial alignment specialist. Assign each intent to a Medicine Wheel direction following Indigenous epistemological frameworks.

## Medicine Wheel Directions

### EAST (Nitsáhákees - Thinking & Beginnings)
- **Essence**: Vision, inquiry, new beginnings
- **Actions**: Exploring, questioning, visioning, initial research
- **Ceremony**: vision_inquiry
- **Indicators**: "What is...?", "How might...?", exploratory verbs

### SOUTH (Nahat'á - Planning & Growth)
- **Essence**: Organization, methodology, growth
- **Actions**: Planning, implementing, data gathering, building
- **Ceremony**: wave_counting
- **Indicators**: "Create...", "Build...", "Implement..."

### WEST (Iina - Living & Action)
- **Essence**: Integration, validation, reflection
- **Actions**: Testing, validating, integrating, reflecting
- **Ceremony**: talking_circles
- **Indicators**: "Test...", "Verify...", "Connect..."

### NORTH (Siihasin - Assurance & Reflection)
- **Essence**: Wisdom, completion, elder knowledge
- **Actions**: Deploying, finalizing, documenting, synthesizing
- **Ceremony**: elder_council
- **Indicators**: "Deploy...", "Complete...", "Report..."

## Intents
{{intentsJson}}

## Dependency Graph
{{dependencyGraphJson}}

## Assignment Process

### Step 1: Natural Alignment
What direction does each intent naturally belong to based on its action type?

### Step 2: Workflow Progression
Ensure the overall workflow follows the natural cycle: EAST → SOUTH → WEST → NORTH

### Step 3: Secondary Directions
Does any intent span multiple directions? Assign secondary directions where appropriate.

## Output Format
```json
{
  "assignments": [
    {
      "intentId": "intent-1",
      "primaryDirection": "EAST",
      "secondaryDirection": null,
      "ceremonyType": "vision_inquiry",
      "rationale": "..."
    }
  ],
  "stageGrouping": {
    "EAST": ["intent-1"],
    "SOUTH": ["intent-2", "intent-3"],
    "WEST": ["intent-4"],
    "NORTH": ["intent-5"]
  }
}
```
```

---

### Prompt 4: `pde-workflow-generation`

**Purpose**: Guide Layer 4 workflow template generation

**What This Enables**: Structured, executable workflow with clear stages

**Arguments**:
```typescript
{
  assignments: WheelAssignment[];
  dependencyGraph: DependencyGraph;
}
```

**Template**:
```
You are a workflow architect. Generate a structured execution workflow from ceremonial assignments and dependencies.

## Assignments
{{assignmentsJson}}

## Dependency Graph
{{dependencyGraphJson}}

## Workflow Requirements

### Stage Structure
Each stage must have:
- **stageId**: Unique identifier
- **direction**: Medicine Wheel direction
- **directionDescription**: Human-readable theme
- **tasks**: Ordered list of tasks
- **checkpointAfter**: Whether to create checkpoint after stage

### Task Structure
Each task must have:
- **id**: Unique identifier
- **description**: What this task accomplishes
- **agentCommand**: CLI command to execute (if applicable)
- **prompt**: Specific prompt for this task
- **expectedOutputs**: What artifacts/results are expected
- **dependencies**: Which task IDs must complete first

### Execution Types
- **sequential**: Tasks run one after another
- **parallel**: Tasks can run simultaneously
- **conditional**: Task runs only if condition met

## Output Format
```json
{
  "workflowId": "uuid",
  "overallIntention": "Summary of what user wants to create",
  "stages": [
    {
      "stageId": "stage-east",
      "direction": "EAST",
      "directionDescription": "Vision & Inquiry",
      "executionType": "sequential",
      "tasks": [
        {
          "id": "task-1",
          "description": "...",
          "agentCommand": "...",
          "prompt": "...",
          "expectedOutputs": ["..."],
          "dependencies": []
        }
      ],
      "checkpointAfter": true
    }
  ]
}
```
```

---

### Prompt 5: `pde-execution-plan`

**Purpose**: Guide Layer 5 execution plan finalization

**What This Enables**: Complete, executable plan with recovery strategies

**Arguments**:
```typescript
{
  workflow: Workflow;
}
```

**Template**:
```
You are an execution planning specialist. Finalize the workflow into a complete execution plan with success criteria and recovery strategies.

## Workflow
{{workflowJson}}

## Execution Plan Requirements

For each task, specify:

### 1. Agent Command
The exact CLI command to execute:
```bash
agent-cli command --flags
```

### 2. Input Context
- Required files
- Required prior results
- Environment requirements

### 3. Success Criteria
How to verify task completion:
- Expected output patterns
- File existence checks
- State validations

### 4. Failure Recovery
What to do if task fails:
- Retry strategy (immediate, backoff, skip)
- Alternative approach
- Escalation path

### 5. Checkpoint Data
What to save for recovery:
- Completed outputs
- Partial progress
- Context snapshot

## Output Format
```json
{
  "planId": "uuid",
  "workflowId": "...",
  "tasks": [
    {
      "taskId": "...",
      "stageId": "...",
      "command": "...",
      "inputs": [...],
      "successCriteria": {
        "type": "output_contains | file_exists | state_check",
        "value": "..."
      },
      "recoveryStrategy": {
        "onFailure": "retry | skip | alternative | abort",
        "retryCount": 3,
        "alternative": "..."
      },
      "checkpointData": {
        "saves": [...],
        "restoresFrom": "..."
      }
    }
  ],
  "metadata": {
    "totalTasks": ...,
    "estimatedDuration": "...",
    "parallelizableTasks": ...,
    "requiredTools": [...]
  }
}
```
```

## Prompt Usage Patterns

### Direct Invocation
Agents can invoke prompts directly with arguments:
```
Use prompt: pde-intent-extraction
Arguments: { userPrompt: "..." }
```

### Chained Execution
Layer prompts are designed for sequential chaining:
1. `pde-intent-extraction` → intents
2. `pde-dependency-analysis` → dependency graph
3. `pde-wheel-assignment` → ceremonial assignments
4. `pde-workflow-generation` → workflow template
5. `pde-execution-plan` → final plan

### Output Parsing
All prompts produce JSON output for programmatic processing.
