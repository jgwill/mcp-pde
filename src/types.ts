/**
 * PDE-MCP Types
 * Core TypeScript interfaces for Prompt Decomposition Engine
 */

// ============================================================================
// Medicine Wheel Types
// ============================================================================

export type MedicineWheelDirection = 'EAST' | 'SOUTH' | 'WEST' | 'NORTH';

export type CeremonyType = 
  | 'vision_inquiry'
  | 'wave_counting'
  | 'talking_circles'
  | 'elder_council';

export interface DirectionMetadata {
  direction: MedicineWheelDirection;
  name: string;
  theme: string;
  description: string;
  ceremonyType: CeremonyType;
  color: string;
  indicators: string[];
}

// ============================================================================
// Intent Types
// ============================================================================

export type IntentType = 
  | 'CREATION'
  | 'MODIFICATION'
  | 'ANALYSIS'
  | 'VALIDATION'
  | 'INTEGRATION'
  | 'COMMUNICATION';

export type IntentPriority = 'primary' | 'secondary' | 'optional';

export interface ExplicitIntent {
  id: string;
  action: string;
  target: string;
  parameters: Record<string, unknown>;
  type: IntentType;
  priority: IntentPriority;
}

export interface ImplicitIntent {
  id: string;
  description: string;
  triggerPhrase: string;
  type: IntentType;
  priority: IntentPriority;
}

export interface Ambiguity {
  aspect: string;
  issue: string;
  suggestedClarification: string;
}

export interface IntentExtractionResult {
  explicitIntents: ExplicitIntent[];
  implicitIntents: ImplicitIntent[];
  ambiguities: Ambiguity[];
}

// ============================================================================
// Dependency Graph Types
// ============================================================================

export type DependencyType = 'must-precede' | 'must-follow' | 'blocks' | 'enables';

export interface DependencyNode {
  id: string;
  inputs: string[];
  outputs: string[];
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: DependencyType;
  reason: string;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  parallelGroups: string[][];
  criticalPath: string[];
  hasCycles: boolean;
}

// ============================================================================
// Wheel Assignment Types
// ============================================================================

export interface WheelAssignment {
  intentId: string;
  primaryDirection: MedicineWheelDirection;
  secondaryDirection: MedicineWheelDirection | null;
  ceremonyType: CeremonyType;
  rationale: string;
}

export interface WheelAssignmentResult {
  assignments: WheelAssignment[];
  stageGrouping: Record<MedicineWheelDirection, string[]>;
}

// ============================================================================
// Workflow Types
// ============================================================================

export type ExecutionType = 'sequential' | 'parallel' | 'conditional';

export interface PdeTask {
  id: string;
  description: string;
  agentCommand?: string;
  prompt: string;
  expectedOutputs: string[];
  dependencies: string[];
}

export interface PdeStage {
  stageId: string;
  direction: MedicineWheelDirection;
  directionDescription: string;
  executionType: ExecutionType;
  tasks: PdeTask[];
  checkpointAfter: boolean;
}

export interface Workflow {
  workflowId: string;
  overallIntention: string;
  stages: PdeStage[];
}

// ============================================================================
// Execution Plan Types
// ============================================================================

export type SuccessCriteriaType = 'output_contains' | 'file_exists' | 'state_check' | 'exit_code';
export type RecoveryAction = 'retry' | 'skip' | 'alternative' | 'abort';

export interface SuccessCriteria {
  type: SuccessCriteriaType;
  value: string | number;
}

export interface RecoveryStrategy {
  onFailure: RecoveryAction;
  retryCount?: number;
  backoffMs?: number;
  alternative?: string;
}

export interface CheckpointData {
  saves: string[];
  restoresFrom?: string;
}

export interface ExecutionTask {
  taskId: string;
  stageId: string;
  command?: string;
  inputs: string[];
  successCriteria: SuccessCriteria;
  recoveryStrategy: RecoveryStrategy;
  checkpointData: CheckpointData;
}

export interface ExecutionMetadata {
  totalTasks: number;
  estimatedDuration: string;
  parallelizableTasks: number;
  requiredTools: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface ExecutionPlan {
  planId: string;
  workflowId: string;
  overallIntention: string;
  stages: PdeStage[];
  tasks: ExecutionTask[];
  metadata: ExecutionMetadata;
}

// ============================================================================
// Execution Result Types
// ============================================================================

export type TaskStatus = 'completed' | 'failed' | 'skipped';

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  output?: string;
  duration: number;
  checkpoint?: string;
}

export interface FailedTask {
  taskId: string;
  error: string;
  attemptCount: number;
  recoveryApplied?: RecoveryAction;
}

export interface WorkflowCheckpoint {
  checkpointId: string;
  workflowId: string;
  stageId: string;
  taskId: string;
  timestamp: string;
  contextSnapshot: Record<string, unknown>;
  resumeInstructions: string;
}

export interface StageResult {
  stageId: string;
  direction: MedicineWheelDirection;
  status: 'completed' | 'partial' | 'failed';
  completedTasks: TaskResult[];
  failedTasks?: FailedTask[];
  checkpoint: WorkflowCheckpoint;
}

export interface WorkflowResult {
  workflowId: string;
  status: 'completed' | 'partial' | 'failed';
  stageResults: StageResult[];
  finalCheckpoint?: WorkflowCheckpoint;
  totalDuration: number;
}

// ============================================================================
// Validation Types
// ============================================================================

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  location?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
  coherenceScore: number;
  completenessScore: number;
}

// ============================================================================
// Error Types
// ============================================================================

export type PdeErrorCode =
  | 'PROMPT_TOO_VAGUE'
  | 'CIRCULAR_DEPENDENCY'
  | 'UNSUPPORTED_INTENT'
  | 'STAGE_NOT_FOUND'
  | 'WORKFLOW_NOT_FOUND'
  | 'DEPENDENCY_FAILED'
  | 'TASK_FAILED'
  | 'CHECKPOINT_NOT_FOUND'
  | 'RECOVERY_FAILED';

export interface PdeError {
  code: PdeErrorCode;
  message: string;
  details?: Record<string, unknown>;
  checkpoint?: WorkflowCheckpoint;
  suggestion?: string;
}

// ============================================================================
// MCP Tool Input Types
// ============================================================================

export interface DecomposeInput {
  prompt: string;
  context?: {
    files?: string[];
    previousResults?: string[];
    userPreferences?: Record<string, string>;
  };
  options?: {
    medicineWheelEnabled?: boolean;
    maxDepth?: number;
    parallelization?: boolean;
  };
}

export interface ExecuteStageInput {
  workflowId: string;
  stageId: string;
  options?: {
    dryRun?: boolean;
    verbose?: boolean;
  };
}

export interface GetCheckpointInput {
  workflowId: string;
  stageId?: string;
}

export interface ResumeWorkflowInput {
  workflowId: string;
  checkpointId: string;
  modifications?: {
    skipTasks?: string[];
    retryStrategy?: 'same' | 'alternative';
  };
}

export interface ValidatePlanInput {
  planId: string;
}

export interface ListWorkflowsInput {
  status?: 'active' | 'completed' | 'failed' | 'all';
  limit?: number;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isMedicineWheelDirection(value: unknown): value is MedicineWheelDirection {
  return typeof value === 'string' && 
    ['EAST', 'SOUTH', 'WEST', 'NORTH'].includes(value);
}

export function isIntentType(value: unknown): value is IntentType {
  return typeof value === 'string' && 
    ['CREATION', 'MODIFICATION', 'ANALYSIS', 'VALIDATION', 'INTEGRATION', 'COMMUNICATION'].includes(value);
}

export function isCeremonyType(value: unknown): value is CeremonyType {
  return typeof value === 'string' &&
    ['vision_inquiry', 'wave_counting', 'talking_circles', 'elder_council'].includes(value);
}

// ============================================================================
// Constants
// ============================================================================

export const DIRECTION_ORDER: MedicineWheelDirection[] = ['EAST', 'SOUTH', 'WEST', 'NORTH'];

export const DIRECTION_METADATA: Record<MedicineWheelDirection, DirectionMetadata> = {
  EAST: {
    direction: 'EAST',
    name: 'Nitsáhákees',
    theme: 'Thinking & Beginnings',
    description: 'Vision, inquiry, exploration, initial research',
    ceremonyType: 'vision_inquiry',
    color: '#FFD700',
    indicators: ['explore', 'what is', 'research', 'investigate', 'understand', 'analyze']
  },
  SOUTH: {
    direction: 'SOUTH',
    name: 'Nahat\'á',
    theme: 'Planning & Growth',
    description: 'Organization, methodology, structural design, implementation',
    ceremonyType: 'wave_counting',
    color: '#32CD32',
    indicators: ['create', 'build', 'implement', 'design', 'develop', 'write', 'make']
  },
  WEST: {
    direction: 'WEST',
    name: 'Iina',
    theme: 'Living & Action',
    description: 'Integration, validation, testing, reflection',
    ceremonyType: 'talking_circles',
    color: '#4682B4',
    indicators: ['test', 'validate', 'verify', 'check', 'integrate', 'connect', 'ensure']
  },
  NORTH: {
    direction: 'NORTH',
    name: 'Siihasin',
    theme: 'Assurance & Reflection',
    description: 'Wisdom, completion, deployment, finalization',
    ceremonyType: 'elder_council',
    color: '#FFFFFF',
    indicators: ['deploy', 'complete', 'finalize', 'report', 'document', 'summarize']
  }
};

export const INTENT_VERBS: Record<IntentType, string[]> = {
  CREATION: ['create', 'generate', 'build', 'make', 'write', 'design', 'develop'],
  MODIFICATION: ['update', 'modify', 'change', 'refactor', 'edit', 'fix', 'improve'],
  ANALYSIS: ['analyze', 'investigate', 'understand', 'research', 'explore', 'find', 'examine'],
  VALIDATION: ['test', 'verify', 'validate', 'check', 'ensure', 'confirm', 'audit'],
  INTEGRATION: ['integrate', 'connect', 'link', 'combine', 'merge', 'sync', 'bridge'],
  COMMUNICATION: ['report', 'notify', 'document', 'log', 'alert', 'summarize', 'present']
};
