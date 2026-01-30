# PDE-MCP Tools Specification
> MCP Tool Definitions for Prompt Decomposition Engine

**Version**: 1.0.0
**Document ID**: pde-mcp-tools-v1

## Creative Intent

### Desired Outcome
LLM agents **create** actionable execution plans through well-defined MCP tools that transform complex prompts into structured, ceremonially-aligned workflows.

## Tool Definitions

### Tool 1: `pde_decompose`

**Purpose**: Decompose a complex prompt into a structured execution plan

**What Users Create**: A complete, transparent workflow from an ambiguous request

**Input Schema**:
```typescript
interface DecomposeInput {
  prompt: string;                    // Raw user prompt to decompose
  context?: {
    files?: string[];                // Relevant file paths
    previousResults?: string[];      // Prior execution results
    userPreferences?: Record<string, string>;
  };
  options?: {
    medicineWheelEnabled?: boolean;  // Enable ceremonial alignment (default: true)
    maxDepth?: number;               // Max dependency graph depth (default: 5)
    parallelization?: boolean;       // Enable parallel task detection (default: true)
  };
}
```

**Output Schema**:
```typescript
interface ExecutionPlan {
  workflowId: string;                // Unique identifier
  overallIntention: string;          // Summary of what user wants to create
  stages: PdeStage[];                // Ceremonially-ordered stages
  metadata: {
    totalTasks: number;
    parallelizableTasks: number;
    estimatedComplexity: 'low' | 'medium' | 'high';
    requiredTools: string[];
  };
}
```

**Behavior**:
1. Runs 5-layer decomposition pipeline
2. Returns structured plan without executing
3. Enables user review before execution

---

### Tool 2: `pde_execute_stage`

**Purpose**: Execute a single stage from a decomposed plan

**What Users Create**: Completed stage outcomes with checkpoint data

**Input Schema**:
```typescript
interface ExecuteStageInput {
  workflowId: string;                // Reference to decomposed plan
  stageId: string;                   // Stage to execute
  options?: {
    dryRun?: boolean;                // Preview commands without executing
    verbose?: boolean;               // Detailed output
  };
}
```

**Output Schema**:
```typescript
interface StageResult {
  stageId: string;
  direction: MedicineWheelDirection;
  status: 'completed' | 'partial' | 'failed';
  completedTasks: TaskResult[];
  failedTasks?: FailedTask[];
  checkpoint: CheckpointData;
}
```

---

### Tool 3: `pde_get_checkpoint`

**Purpose**: Retrieve checkpoint data for workflow recovery

**What Users Create**: Recovery context enabling seamless resume

**Input Schema**:
```typescript
interface GetCheckpointInput {
  workflowId: string;
  stageId?: string;                  // Optional: specific stage
}
```

**Output Schema**:
```typescript
interface CheckpointData {
  workflowId: string;
  lastCompletedStage: string;
  lastCompletedTask: string;
  contextSnapshot: Record<string, any>;
  resumeInstructions: string;
}
```

---

### Tool 4: `pde_resume_workflow`

**Purpose**: Resume execution from a checkpoint after failure

**What Users Create**: Continued progress from failure point

**Input Schema**:
```typescript
interface ResumeWorkflowInput {
  workflowId: string;
  checkpointId: string;
  modifications?: {
    skipTasks?: string[];            // Tasks to skip
    retryStrategy?: 'same' | 'alternative';
  };
}
```

**Output Schema**:
```typescript
interface ResumeResult {
  resumed: boolean;
  fromStage: string;
  fromTask: string;
  remainingStages: string[];
}
```

---

### Tool 5: `pde_validate_plan`

**Purpose**: Validate an execution plan for completeness and coherence

**What Users Create**: Confidence in plan quality before execution

**Input Schema**:
```typescript
interface ValidatePlanInput {
  workflowId: string;
}
```

**Output Schema**:
```typescript
interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
  coherenceScore: number;           // 0-100
  completenessScore: number;        // 0-100
}
```

---

### Tool 6: `pde_list_workflows`

**Purpose**: List active and completed workflows

**What Users Create**: Visibility into workflow history

**Input Schema**:
```typescript
interface ListWorkflowsInput {
  status?: 'active' | 'completed' | 'failed' | 'all';
  limit?: number;
}
```

**Output Schema**:
```typescript
interface WorkflowList {
  workflows: WorkflowSummary[];
  total: number;
}
```

## Error Handling

### Decomposition Errors
- `PROMPT_TOO_VAGUE`: Prompt lacks actionable intent
- `CIRCULAR_DEPENDENCY`: Dependency graph contains cycles
- `UNSUPPORTED_INTENT`: Intent type not recognized

### Execution Errors
- `STAGE_NOT_FOUND`: Referenced stage doesn't exist
- `WORKFLOW_NOT_FOUND`: Workflow ID invalid
- `DEPENDENCY_FAILED`: Required prior task not completed

### Recovery Strategies
Each error includes:
- Human-readable message
- Suggested recovery action
- Related checkpoint data (if available)
