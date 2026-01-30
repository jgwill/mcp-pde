/**
 * PDE Engine
 * 5-layer Prompt Decomposition Engine
 */

import { v4 as uuidv4 } from 'uuid';
import {
  type DecomposeInput,
  type ExecutionPlan,
  type IntentExtractionResult,
  type DependencyGraph,
  type WheelAssignmentResult,
  type Workflow,
  type PdeStage,
  type PdeTask,
  type ExecutionTask,
  type ExecutionMetadata,
  type ExplicitIntent,
  type ImplicitIntent,
  type IntentType,
  type MedicineWheelDirection,
  type CeremonyType,
  type DependencyNode,
  type DependencyEdge,
  type WheelAssignment,
  type WorkflowCheckpoint,
  type ValidationResult,
  type ValidationIssue,
  DIRECTION_ORDER,
  DIRECTION_METADATA,
  INTENT_VERBS,
} from './types.js';

/**
 * Configuration for the PDE Engine
 */
export interface PdeEngineConfig {
  medicineWheelEnabled: boolean;
  maxDepth: number;
  parallelization: boolean;
}

const DEFAULT_CONFIG: PdeEngineConfig = {
  medicineWheelEnabled: true,
  maxDepth: 5,
  parallelization: true,
};

/**
 * In-memory storage for workflows and checkpoints
 */
const workflows = new Map<string, ExecutionPlan>();
const checkpoints = new Map<string, WorkflowCheckpoint>();

/**
 * Main PDE Engine class
 */
export class PdeEngine {
  private config: PdeEngineConfig;

  constructor(config: Partial<PdeEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main decomposition entry point - runs all 5 layers
   */
  async decompose(input: DecomposeInput): Promise<ExecutionPlan> {
    const config = {
      ...this.config,
      ...(input.options || {}),
    };

    // Layer 1: Intent Extraction
    const intents = this.extractIntents(input.prompt, input.context);

    // Layer 2: Dependency Graph Construction
    const dependencyGraph = this.buildDependencyGraph(intents);

    // Layer 3: Medicine Wheel Direction Assignment
    const wheelAssignment = config.medicineWheelEnabled
      ? this.assignWheelDirections(intents, dependencyGraph)
      : this.assignDefaultDirections(intents);

    // Layer 4: Workflow Template Generation
    const workflow = this.generateWorkflow(intents, dependencyGraph, wheelAssignment, input.prompt);

    // Layer 5: Execution Plan with Checkpoints
    const plan = this.createExecutionPlan(workflow, config);

    // Store for later retrieval
    workflows.set(plan.planId, plan);

    return plan;
  }

  /**
   * Layer 1: Intent Extraction & Classification
   */
  extractIntents(
    prompt: string,
    context?: DecomposeInput['context']
  ): IntentExtractionResult {
    const words = prompt.toLowerCase().split(/\s+/);
    const explicitIntents: ExplicitIntent[] = [];
    const implicitIntents: ImplicitIntent[] = [];

    // Extract explicit intents based on action verbs
    let intentCounter = 0;
    for (const [intentType, verbs] of Object.entries(INTENT_VERBS)) {
      for (const verb of verbs) {
        const verbIndex = words.findIndex(w => w.startsWith(verb));
        if (verbIndex !== -1) {
          // Find the target (next noun-like word after verb)
          const target = this.extractTarget(words, verbIndex);
          explicitIntents.push({
            id: `intent-${++intentCounter}`,
            action: verb,
            target,
            parameters: this.extractParameters(prompt, verb, target),
            type: intentType as IntentType,
            priority: intentCounter === 1 ? 'primary' : 'secondary',
          });
        }
      }
    }

    // Deduplicate intents by action+target
    const seen = new Set<string>();
    const deduped = explicitIntents.filter(intent => {
      const key = `${intent.action}-${intent.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Check for implicit intents
    const implicitPatterns = [
      { pattern: /which (I assume|should|would)/i, type: 'VALIDATION' as IntentType },
      { pattern: /you will/i, type: 'CREATION' as IntentType },
      { pattern: /somehow/i, type: 'ANALYSIS' as IntentType },
      { pattern: /I expect/i, type: 'VALIDATION' as IntentType },
      { pattern: /and (also|then)/i, type: 'INTEGRATION' as IntentType },
    ];

    for (const { pattern, type } of implicitPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        implicitIntents.push({
          id: `implicit-${implicitIntents.length + 1}`,
          description: `Implicit requirement detected near "${match[0]}"`,
          triggerPhrase: match[0],
          type,
          priority: 'secondary',
        });
      }
    }

    // Detect ambiguities
    const ambiguities = [];
    if (deduped.length === 0) {
      ambiguities.push({
        aspect: 'action',
        issue: 'No clear action verb detected',
        suggestedClarification: 'What specific action would you like to perform?',
      });
    }

    return {
      explicitIntents: deduped,
      implicitIntents,
      ambiguities,
    };
  }

  private extractTarget(words: string[], verbIndex: number): string {
    // Look for the next significant word after the verb
    const stopWords = new Set(['a', 'an', 'the', 'with', 'for', 'to', 'and', 'or', 'in', 'on']);
    for (let i = verbIndex + 1; i < Math.min(verbIndex + 5, words.length); i++) {
      const word = words[i].replace(/[^a-z]/g, '');
      if (word.length > 2 && !stopWords.has(word)) {
        return word;
      }
    }
    return 'unknown';
  }

  private extractParameters(prompt: string, verb: string, target: string): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    
    // Extract "with X" patterns
    const withMatch = prompt.match(new RegExp(`${verb}.*?with\\s+([\\w\\s,]+?)(?:\\.|,|and|$)`, 'i'));
    if (withMatch) {
      params.with = withMatch[1].trim().split(/,\s*/);
    }

    // Extract "using X" patterns
    const usingMatch = prompt.match(/using\s+([\w\s,]+?)(?:\.|,|and|$)/i);
    if (usingMatch) {
      params.using = usingMatch[1].trim().split(/,\s*/);
    }

    // Extract "to X" patterns (destination/purpose)
    const toMatch = prompt.match(new RegExp(`${target}.*?to\\s+([\\w\\s]+?)(?:\\.|,|and|$)`, 'i'));
    if (toMatch) {
      params.to = toMatch[1].trim();
    }

    return params;
  }

  /**
   * Layer 2: Dependency Graph Construction
   */
  buildDependencyGraph(intents: IntentExtractionResult): DependencyGraph {
    const allIntents = [
      ...intents.explicitIntents,
      ...intents.implicitIntents,
    ];

    const nodes: DependencyNode[] = allIntents.map(intent => ({
      id: intent.id,
      inputs: [],
      outputs: ['type' in intent && (intent as ExplicitIntent).target ? [(intent as ExplicitIntent).target] : []].flat(),
    }));

    const edges: DependencyEdge[] = [];
    const parallelGroups: string[][] = [];

    // Build edges based on intent types
    // ANALYSIS typically comes before CREATION
    // CREATION typically comes before VALIDATION
    // VALIDATION typically comes before COMMUNICATION
    const typeOrder: IntentType[] = ['ANALYSIS', 'CREATION', 'MODIFICATION', 'INTEGRATION', 'VALIDATION', 'COMMUNICATION'];

    for (let i = 0; i < allIntents.length; i++) {
      for (let j = i + 1; j < allIntents.length; j++) {
        const a = allIntents[i];
        const b = allIntents[j];
        const aTypeIndex = typeOrder.indexOf(a.type);
        const bTypeIndex = typeOrder.indexOf(b.type);

        if (aTypeIndex < bTypeIndex) {
          edges.push({
            from: a.id,
            to: b.id,
            type: 'must-precede',
            reason: `${a.type} typically precedes ${b.type}`,
          });
        }
      }
    }

    // Find parallel groups (intents of same type can run in parallel)
    const byType = new Map<IntentType, string[]>();
    for (const intent of allIntents) {
      const list = byType.get(intent.type) || [];
      list.push(intent.id);
      byType.set(intent.type, list);
    }
    for (const group of byType.values()) {
      if (group.length > 1) {
        parallelGroups.push(group);
      }
    }

    // Calculate critical path (longest chain)
    const criticalPath = this.findCriticalPath(nodes, edges);

    return {
      nodes,
      edges,
      parallelGroups,
      criticalPath,
      hasCycles: this.detectCycles(nodes, edges),
    };
  }

  private findCriticalPath(nodes: DependencyNode[], edges: DependencyEdge[]): string[] {
    if (nodes.length === 0) return [];
    
    // Build adjacency list
    const adj = new Map<string, string[]>();
    for (const node of nodes) {
      adj.set(node.id, []);
    }
    for (const edge of edges) {
      if (edge.type === 'must-precede') {
        adj.get(edge.from)?.push(edge.to);
      }
    }

    // Find longest path using DFS
    const visited = new Set<string>();
    let longestPath: string[] = [];

    const dfs = (nodeId: string, path: string[]): void => {
      path.push(nodeId);
      if (path.length > longestPath.length) {
        longestPath = [...path];
      }

      const neighbors = adj.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          dfs(neighbor, path);
          visited.delete(neighbor);
        }
      }
      path.pop();
    };

    // Try starting from each node
    for (const node of nodes) {
      visited.clear();
      visited.add(node.id);
      dfs(node.id, []);
    }

    return longestPath;
  }

  private detectCycles(nodes: DependencyNode[], edges: DependencyEdge[]): boolean {
    const adj = new Map<string, string[]>();
    for (const node of nodes) {
      adj.set(node.id, []);
    }
    for (const edge of edges) {
      adj.get(edge.from)?.push(edge.to);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      for (const neighbor of adj.get(nodeId) || []) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) return true;
      }
    }

    return false;
  }

  /**
   * Layer 3: Medicine Wheel Direction Assignment
   */
  assignWheelDirections(
    intents: IntentExtractionResult,
    graph: DependencyGraph
  ): WheelAssignmentResult {
    const allIntents = [...intents.explicitIntents, ...intents.implicitIntents];
    const assignments: WheelAssignment[] = [];
    const stageGrouping: Record<MedicineWheelDirection, string[]> = {
      EAST: [],
      SOUTH: [],
      WEST: [],
      NORTH: [],
    };

    // Map intent types to directions
    const typeToDirection: Record<IntentType, MedicineWheelDirection> = {
      ANALYSIS: 'EAST',
      CREATION: 'SOUTH',
      MODIFICATION: 'SOUTH',
      INTEGRATION: 'WEST',
      VALIDATION: 'WEST',
      COMMUNICATION: 'NORTH',
    };

    for (const intent of allIntents) {
      const primaryDirection = typeToDirection[intent.type];
      const ceremonyType = DIRECTION_METADATA[primaryDirection].ceremonyType;

      assignments.push({
        intentId: intent.id,
        primaryDirection,
        secondaryDirection: null,
        ceremonyType,
        rationale: `${intent.type} intent naturally aligns with ${primaryDirection} (${DIRECTION_METADATA[primaryDirection].theme})`,
      });

      stageGrouping[primaryDirection].push(intent.id);
    }

    return { assignments, stageGrouping };
  }

  private assignDefaultDirections(intents: IntentExtractionResult): WheelAssignmentResult {
    // Without Medicine Wheel, just group sequentially
    const allIntents = [...intents.explicitIntents, ...intents.implicitIntents];
    const assignments: WheelAssignment[] = allIntents.map(intent => ({
      intentId: intent.id,
      primaryDirection: 'SOUTH' as MedicineWheelDirection,
      secondaryDirection: null,
      ceremonyType: 'wave_counting' as CeremonyType,
      rationale: 'Default assignment (Medicine Wheel disabled)',
    }));

    return {
      assignments,
      stageGrouping: {
        EAST: [],
        SOUTH: allIntents.map(i => i.id),
        WEST: [],
        NORTH: [],
      },
    };
  }

  /**
   * Layer 4: Workflow Template Generation
   */
  generateWorkflow(
    intents: IntentExtractionResult,
    graph: DependencyGraph,
    wheelAssignment: WheelAssignmentResult,
    originalPrompt: string
  ): Workflow {
    const workflowId = uuidv4();
    const stages: PdeStage[] = [];

    // Create stages for each direction that has intents
    for (const direction of DIRECTION_ORDER) {
      const intentIds = wheelAssignment.stageGrouping[direction];
      if (intentIds.length === 0) continue;

      const metadata = DIRECTION_METADATA[direction];
      const tasks: PdeTask[] = [];

      for (const intentId of intentIds) {
        const intent = [...intents.explicitIntents, ...intents.implicitIntents]
          .find(i => i.id === intentId);
        
        if (!intent) continue;

        // Find dependencies from graph
        const deps = graph.edges
          .filter(e => e.to === intentId && e.type === 'must-precede')
          .map(e => e.from);

        tasks.push({
          id: `task-${intent.id}`,
          description: 'action' in intent 
            ? `${(intent as ExplicitIntent).action} ${(intent as ExplicitIntent).target}`
            : (intent as ImplicitIntent).description,
          prompt: this.generateTaskPrompt(intent, originalPrompt),
          expectedOutputs: ['action' in intent ? (intent as ExplicitIntent).target : 'result'],
          dependencies: deps.map(d => `task-${d}`),
        });
      }

      // Determine execution type based on parallel groups
      const canParallelize = graph.parallelGroups.some(
        group => group.every(id => intentIds.includes(id))
      );

      stages.push({
        stageId: `stage-${direction.toLowerCase()}`,
        direction,
        directionDescription: `${metadata.theme} - ${metadata.description}`,
        executionType: canParallelize ? 'parallel' : 'sequential',
        tasks,
        checkpointAfter: true,
      });
    }

    return {
      workflowId,
      overallIntention: this.summarizeIntention(originalPrompt, intents),
      stages,
    };
  }

  private generateTaskPrompt(intent: ExplicitIntent | ImplicitIntent, originalPrompt: string): string {
    if ('action' in intent) {
      return `${intent.action} ${intent.target}: Based on the original request "${originalPrompt}", ` +
        `focus specifically on the ${intent.action} action targeting ${intent.target}.`;
    }
    return `Address implicit requirement: ${intent.description}`;
  }

  private summarizeIntention(prompt: string, intents: IntentExtractionResult): string {
    const actions = intents.explicitIntents.map(i => `${i.action} ${i.target}`);
    if (actions.length === 0) return prompt.slice(0, 100);
    if (actions.length === 1) return actions[0];
    return `${actions.slice(0, -1).join(', ')} and ${actions[actions.length - 1]}`;
  }

  /**
   * Layer 5: Execution Plan with Checkpoints
   */
  createExecutionPlan(workflow: Workflow, config: PdeEngineConfig): ExecutionPlan {
    const planId = uuidv4();
    const executionTasks: ExecutionTask[] = [];

    for (const stage of workflow.stages) {
      for (const task of stage.tasks) {
        executionTasks.push({
          taskId: task.id,
          stageId: stage.stageId,
          command: task.agentCommand,
          inputs: task.dependencies,
          successCriteria: {
            type: 'output_contains',
            value: 'completed',
          },
          recoveryStrategy: {
            onFailure: 'retry',
            retryCount: 3,
            backoffMs: 1000,
          },
          checkpointData: {
            saves: task.expectedOutputs,
            restoresFrom: task.dependencies[0],
          },
        });
      }
    }

    // Calculate metadata
    const totalTasks = executionTasks.length;
    const parallelizableTasks = workflow.stages
      .filter(s => s.executionType === 'parallel')
      .reduce((sum, s) => sum + s.tasks.length, 0);

    const metadata: ExecutionMetadata = {
      totalTasks,
      estimatedDuration: this.estimateDuration(totalTasks),
      parallelizableTasks,
      requiredTools: this.extractRequiredTools(workflow),
      estimatedComplexity: totalTasks > 10 ? 'high' : totalTasks > 5 ? 'medium' : 'low',
    };

    return {
      planId,
      workflowId: workflow.workflowId,
      overallIntention: workflow.overallIntention,
      stages: workflow.stages,
      tasks: executionTasks,
      metadata,
    };
  }

  private estimateDuration(taskCount: number): string {
    const minutes = taskCount * 2; // Rough estimate: 2 min per task
    if (minutes < 60) return `${minutes} minutes`;
    return `${Math.round(minutes / 60)} hours`;
  }

  private extractRequiredTools(workflow: Workflow): string[] {
    const tools = new Set<string>();
    for (const stage of workflow.stages) {
      for (const task of stage.tasks) {
        if (task.agentCommand) {
          const tool = task.agentCommand.split(' ')[0];
          tools.add(tool);
        }
      }
    }
    // Add default tools
    tools.add('llm-agent');
    return Array.from(tools);
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Get a stored workflow by ID
   */
  getWorkflow(workflowId: string): ExecutionPlan | undefined {
    return Array.from(workflows.values()).find(w => w.workflowId === workflowId);
  }

  /**
   * Get a stored plan by ID
   */
  getPlan(planId: string): ExecutionPlan | undefined {
    return workflows.get(planId);
  }

  /**
   * List all workflows
   */
  listWorkflows(status?: 'active' | 'completed' | 'failed' | 'all', limit?: number): ExecutionPlan[] {
    const all = Array.from(workflows.values());
    const filtered = status === 'all' || !status ? all : all; // TODO: track status
    return limit ? filtered.slice(0, limit) : filtered;
  }

  /**
   * Store a checkpoint
   */
  saveCheckpoint(checkpoint: WorkflowCheckpoint): void {
    checkpoints.set(checkpoint.checkpointId, checkpoint);
  }

  /**
   * Get checkpoint data
   */
  getCheckpoint(workflowId: string, stageId?: string): WorkflowCheckpoint | undefined {
    for (const cp of checkpoints.values()) {
      if (cp.workflowId === workflowId) {
        if (!stageId || cp.stageId === stageId) {
          return cp;
        }
      }
    }
    return undefined;
  }

  /**
   * Validate an execution plan
   */
  validatePlan(planId: string): ValidationResult {
    const plan = workflows.get(planId);
    const issues: ValidationIssue[] = [];
    let coherenceScore = 100;
    let completenessScore = 100;

    if (!plan) {
      return {
        isValid: false,
        issues: [{
          severity: 'error',
          code: 'PLAN_NOT_FOUND',
          message: 'Plan not found',
        }],
        suggestions: [],
        coherenceScore: 0,
        completenessScore: 0,
      };
    }

    // Check for empty stages
    for (const stage of plan.stages) {
      if (stage.tasks.length === 0) {
        issues.push({
          severity: 'warning',
          code: 'EMPTY_STAGE',
          message: `Stage ${stage.stageId} has no tasks`,
          location: stage.stageId,
        });
        coherenceScore -= 10;
      }
    }

    // Check for missing dependencies
    const allTaskIds = new Set(plan.tasks.map(t => t.taskId));
    for (const task of plan.tasks) {
      for (const dep of task.inputs) {
        if (!allTaskIds.has(dep)) {
          issues.push({
            severity: 'error',
            code: 'MISSING_DEPENDENCY',
            message: `Task ${task.taskId} depends on non-existent task ${dep}`,
            location: task.taskId,
          });
          completenessScore -= 20;
        }
      }
    }

    // Check all four directions are represented
    const directions = new Set(plan.stages.map(s => s.direction));
    for (const dir of DIRECTION_ORDER) {
      if (!directions.has(dir)) {
        issues.push({
          severity: 'info',
          code: 'MISSING_DIRECTION',
          message: `No tasks assigned to ${dir} direction`,
          suggestion: `Consider if any tasks could benefit from ${DIRECTION_METADATA[dir].theme} perspective`,
        });
      }
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      suggestions: issues.filter(i => i.suggestion).map(i => i.suggestion!),
      coherenceScore: Math.max(0, coherenceScore),
      completenessScore: Math.max(0, completenessScore),
    };
  }
}

// Export singleton instance for convenience
export const pdeEngine = new PdeEngine();
