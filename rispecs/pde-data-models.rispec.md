# PDE-MCP Data Models Specification
> TypeScript Interface Definitions for Prompt Decomposition Engine

**Version**: 1.0.0
**Document ID**: pde-mcp-data-models-v1

## Creative Intent

### Desired Outcome
Developers **create** type-safe implementations of PDE with clear, well-documented data structures that enable compile-time validation and IDE support.

## Core Data Models

### Medicine Wheel Types

```typescript
/**
 * The four sacred directions of the Medicine Wheel
 */
export type MedicineWheelDirection = 'EAST' | 'SOUTH' | 'WEST' | 'NORTH';

/**
 * Ceremony types aligned with each direction
 */
export type CeremonyType = 
  | 'vision_inquiry'    // EAST
  | 'wave_counting'     // SOUTH
  | 'talking_circles'   // WEST
  | 'elder_council';    // NORTH

/**
 * Complete direction metadata
 */
export interface DirectionMetadata {
  direction: MedicineWheelDirection;
  name: string;           // Indigenous name (e.g., "Nitsáhákees")
  theme: string;          // Theme (e.g., "Thinking & Beginnings")
  description: string;    // Detailed description
  ceremonyType: CeremonyType;
  color: string;          // Hex color for visualization
  indicators: string[];   // Phrases that signal this direction
}
```

### Intent Types

```typescript
/**
 * Classification of user intent types
 */
export type IntentType = 
  | 'CREATION'       // Generate new artifacts
  | 'MODIFICATION'   // Update existing elements
  | 'ANALYSIS'       // Investigate/understand
  | 'VALIDATION'     // Verify/test
  | 'INTEGRATION'    // Connect systems
  | 'COMMUNICATION'; // Report/document

/**
 * Priority levels for intents
 */
export type IntentPriority = 'primary' | 'secondary' | 'optional';

/**
 * An explicit intent extracted from user prompt
 */
export interface ExplicitIntent {
  id: string;
  action: string;           // The verb/operation
  target: string;           // What is being acted upon
  parameters: Record<string, unknown>;
  type: IntentType;
  priority: IntentPriority;
}

/**
 * An implicit intent discovered through analysis
 */
export interface ImplicitIntent {
  id: string;
  description: string;
  triggerPhrase: string;    // The phrase that signaled this
  type: IntentType;
  priority: IntentPriority;
}

/**
 * Ambiguity detected in the prompt
 */
export interface Ambiguity {
  aspect: string;
  issue: string;
  suggestedClarification: string;
}

/**
 * Complete output from Layer 1: Intent Extraction
 */
export interface IntentExtractionResult {
  explicitIntents: ExplicitIntent[];
  implicitIntents: ImplicitIntent[];
  ambiguities: Ambiguity[];
}
```

### Dependency Graph Types

```typescript
/**
 * Edge types in dependency graph
 */
export type DependencyType = 
  | 'must-precede'  // A must complete before B
  | 'must-follow'   // A must happen after B
  | 'blocks'        // A blocks B from parallel execution
  | 'enables';      // A enables optional path to B

/**
 * Node in dependency graph
 */
export interface DependencyNode {
  id: string;           // Intent ID
  inputs: string[];     // Required inputs
  outputs: string[];    // Produced outputs
}

/**
 * Edge in dependency graph
 */
export interface DependencyEdge {
  from: string;         // Source intent ID
  to: string;           // Target intent ID
  type: DependencyType;
  reason: string;       // Why this dependency exists
}

/**
 * Complete output from Layer 2: Dependency Analysis
 */
export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  parallelGroups: string[][];  // Groups of intents that can run in parallel
  criticalPath: string[];      // Longest dependency chain
  hasCycles: boolean;
}
```

### Wheel Assignment Types

```typescript
/**
 * Medicine Wheel assignment for an intent
 */
export interface WheelAssignment {
  intentId: string;
  primaryDirection: MedicineWheelDirection;
  secondaryDirection: MedicineWheelDirection | null;
  ceremonyType: CeremonyType;
  rationale: string;
}

/**
 * Complete output from Layer 3: Wheel Assignment
 */
export interface WheelAssignmentResult {
  assignments: WheelAssignment[];
  stageGrouping: Record<MedicineWheelDirection, string[]>;
}
```

### Workflow Types

```typescript
/**
 * Execution type for a stage
 */
export type ExecutionType = 'sequential' | 'parallel' | 'conditional';

/**
 * A single task in the workflow
 */
export interface PdeTask {
  id: string;
  description: string;
  agentCommand?: string;      // CLI command if applicable
  prompt: string;             // Specific prompt for this task
  expectedOutputs: string[];
  dependencies: string[];     // Task IDs this depends on
}

/**
 * A stage in the workflow (one per direction)
 */
export interface PdeStage {
  stageId: string;
  direction: MedicineWheelDirection;
  directionDescription: string;
  executionType: ExecutionType;
  tasks: PdeTask[];
  checkpointAfter: boolean;
}

/**
 * Complete workflow from Layer 4
 */
export interface Workflow {
  workflowId: string;
  overallIntention: string;
  stages: PdeStage[];
}
```

### Execution Plan Types

```typescript
/**
 * Success criteria types
 */
export type SuccessCriteriaType = 
  | 'output_contains'
  | 'file_exists'
  | 'state_check'
  | 'exit_code';

/**
 * Recovery actions on failure
 */
export type RecoveryAction = 
  | 'retry'
  | 'skip'
  | 'alternative'
  | 'abort';

/**
 * Success criteria for a task
 */
export interface SuccessCriteria {
  type: SuccessCriteriaType;
  value: string | number;
}

/**
 * Recovery strategy for a task
 */
export interface RecoveryStrategy {
  onFailure: RecoveryAction;
  retryCount?: number;
  backoffMs?: number;
  alternative?: string;
}

/**
 * Checkpoint data for recovery
 */
export interface CheckpointData {
  saves: string[];         // What to save
  restoresFrom?: string;   // Previous checkpoint ID
}

/**
 * Task in execution plan
 */
export interface ExecutionTask {
  taskId: string;
  stageId: string;
  command?: string;
  inputs: string[];
  successCriteria: SuccessCriteria;
  recoveryStrategy: RecoveryStrategy;
  checkpointData: CheckpointData;
}

/**
 * Execution plan metadata
 */
export interface ExecutionMetadata {
  totalTasks: number;
  estimatedDuration: string;
  parallelizableTasks: number;
  requiredTools: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

/**
 * Complete execution plan from Layer 5
 */
export interface ExecutionPlan {
  planId: string;
  workflowId: string;
  overallIntention: string;
  stages: PdeStage[];
  tasks: ExecutionTask[];
  metadata: ExecutionMetadata;
}
```

### Execution Result Types

```typescript
/**
 * Status of a completed task
 */
export type TaskStatus = 'completed' | 'failed' | 'skipped';

/**
 * Result of a single task execution
 */
export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  output?: string;
  duration: number;       // ms
  checkpoint?: string;    // Checkpoint ID if created
}

/**
 * Failed task details
 */
export interface FailedTask {
  taskId: string;
  error: string;
  attemptCount: number;
  recoveryApplied?: RecoveryAction;
}

/**
 * Result of stage execution
 */
export interface StageResult {
  stageId: string;
  direction: MedicineWheelDirection;
  status: 'completed' | 'partial' | 'failed';
  completedTasks: TaskResult[];
  failedTasks?: FailedTask[];
  checkpoint: WorkflowCheckpoint;
}

/**
 * Checkpoint for workflow recovery
 */
export interface WorkflowCheckpoint {
  checkpointId: string;
  workflowId: string;
  stageId: string;
  taskId: string;
  timestamp: string;
  contextSnapshot: Record<string, unknown>;
  resumeInstructions: string;
}

/**
 * Complete workflow execution result
 */
export interface WorkflowResult {
  workflowId: string;
  status: 'completed' | 'partial' | 'failed';
  stageResults: StageResult[];
  finalCheckpoint?: WorkflowCheckpoint;
  totalDuration: number;  // ms
}
```

### Validation Types

```typescript
/**
 * Severity of validation issue
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * A validation issue
 */
export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  location?: string;     // Where in the plan
  suggestion?: string;   // How to fix
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
  coherenceScore: number;      // 0-100
  completenessScore: number;   // 0-100
}
```

### Error Types

```typescript
/**
 * PDE error codes
 */
export type PdeErrorCode =
  // Decomposition errors
  | 'PROMPT_TOO_VAGUE'
  | 'CIRCULAR_DEPENDENCY'
  | 'UNSUPPORTED_INTENT'
  // Execution errors
  | 'STAGE_NOT_FOUND'
  | 'WORKFLOW_NOT_FOUND'
  | 'DEPENDENCY_FAILED'
  | 'TASK_FAILED'
  // Recovery errors
  | 'CHECKPOINT_NOT_FOUND'
  | 'RECOVERY_FAILED';

/**
 * PDE error
 */
export interface PdeError {
  code: PdeErrorCode;
  message: string;
  details?: Record<string, unknown>;
  checkpoint?: WorkflowCheckpoint;
  suggestion?: string;
}
```

## Type Guards

```typescript
/**
 * Check if value is a valid MedicineWheelDirection
 */
export function isMedicineWheelDirection(value: unknown): value is MedicineWheelDirection {
  return typeof value === 'string' && 
    ['EAST', 'SOUTH', 'WEST', 'NORTH'].includes(value);
}

/**
 * Check if value is a valid IntentType
 */
export function isIntentType(value: unknown): value is IntentType {
  return typeof value === 'string' && 
    ['CREATION', 'MODIFICATION', 'ANALYSIS', 'VALIDATION', 'INTEGRATION', 'COMMUNICATION'].includes(value);
}
```

## Factory Functions

```typescript
/**
 * Create a new workflow with default values
 */
export function createWorkflow(overallIntention: string): Workflow {
  return {
    workflowId: crypto.randomUUID(),
    overallIntention,
    stages: []
  };
}

/**
 * Create a new stage
 */
export function createStage(
  direction: MedicineWheelDirection,
  directionDescription: string
): PdeStage {
  return {
    stageId: `stage-${direction.toLowerCase()}`,
    direction,
    directionDescription,
    executionType: 'sequential',
    tasks: [],
    checkpointAfter: true
  };
}

/**
 * Create a checkpoint
 */
export function createCheckpoint(
  workflowId: string,
  stageId: string,
  taskId: string,
  context: Record<string, unknown>
): WorkflowCheckpoint {
  return {
    checkpointId: crypto.randomUUID(),
    workflowId,
    stageId,
    taskId,
    timestamp: new Date().toISOString(),
    contextSnapshot: context,
    resumeInstructions: `Resume from stage ${stageId}, task ${taskId}`
  };
}
```
