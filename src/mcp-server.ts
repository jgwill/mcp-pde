/**
 * MCP Server for PDE
 * Implements Model Context Protocol server with PDE tools, resources, and prompts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { PdeEngine } from './pde-engine.js';
import {
  type DecomposeInput,
  type ExecuteStageInput,
  type GetCheckpointInput,
  type ValidatePlanInput,
  type ListWorkflowsInput,
  DIRECTION_METADATA,
  INTENT_VERBS,
} from './types.js';

// Initialize PDE Engine
const engine = new PdeEngine();

// Create MCP Server
const server = new Server(
  {
    name: 'pde-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// ============================================================================
// Tools Handler
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'pde_decompose',
        description: 'Decompose a complex prompt into a structured, ceremonially-aligned execution plan',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The complex prompt to decompose',
            },
            context: {
              type: 'object',
              properties: {
                files: { type: 'array', items: { type: 'string' } },
                previousResults: { type: 'array', items: { type: 'string' } },
              },
            },
            options: {
              type: 'object',
              properties: {
                medicineWheelEnabled: { type: 'boolean', default: true },
                maxDepth: { type: 'number', default: 5 },
                parallelization: { type: 'boolean', default: true },
              },
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'pde_get_plan',
        description: 'Retrieve a previously decomposed execution plan by ID',
        inputSchema: {
          type: 'object',
          properties: {
            planId: { type: 'string', description: 'The plan ID to retrieve' },
          },
          required: ['planId'],
        },
      },
      {
        name: 'pde_validate_plan',
        description: 'Validate an execution plan for completeness and coherence',
        inputSchema: {
          type: 'object',
          properties: {
            planId: { type: 'string', description: 'The plan ID to validate' },
          },
          required: ['planId'],
        },
      },
      {
        name: 'pde_get_checkpoint',
        description: 'Retrieve checkpoint data for workflow recovery',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: { type: 'string', description: 'Workflow ID' },
            stageId: { type: 'string', description: 'Optional stage ID' },
          },
          required: ['workflowId'],
        },
      },
      {
        name: 'pde_list_workflows',
        description: 'List all active and completed workflows',
        inputSchema: {
          type: 'object',
          properties: {
            status: { 
              type: 'string', 
              enum: ['active', 'completed', 'failed', 'all'],
              default: 'all',
            },
            limit: { type: 'number', default: 10 },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'pde_decompose': {
        const input = args as unknown as DecomposeInput;
        if (!input?.prompt) {
          return {
            content: [{ type: 'text', text: 'Missing required parameter: prompt' }],
            isError: true,
          };
        }
        const plan = await engine.decompose(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(plan, null, 2),
            },
          ],
        };
      }

      case 'pde_get_plan': {
        const { planId } = args as { planId: string };
        const plan = engine.getPlan(planId);
        if (!plan) {
          return {
            content: [{ type: 'text', text: `Plan ${planId} not found` }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(plan, null, 2) }],
        };
      }

      case 'pde_validate_plan': {
        const { planId } = args as unknown as ValidatePlanInput;
        const result = engine.validatePlan(planId);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'pde_get_checkpoint': {
        const { workflowId, stageId } = args as unknown as GetCheckpointInput;
        const checkpoint = engine.getCheckpoint(workflowId, stageId);
        if (!checkpoint) {
          return {
            content: [{ type: 'text', text: 'No checkpoint found' }],
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(checkpoint, null, 2) }],
        };
      }

      case 'pde_list_workflows': {
        const { status, limit } = (args || {}) as ListWorkflowsInput;
        const workflows = engine.listWorkflows(status, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                workflows.map(w => ({
                  planId: w.planId,
                  workflowId: w.workflowId,
                  intention: w.overallIntention,
                  stageCount: w.stages.length,
                  taskCount: w.metadata.totalTasks,
                })),
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// Resources Handler
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'pde://ceremonies/medicine-wheel',
        name: 'Medicine Wheel Directions',
        description: 'Medicine Wheel direction definitions and mapping criteria',
        mimeType: 'application/json',
      },
      {
        uri: 'pde://schemas/intent-types',
        name: 'Intent Types Schema',
        description: 'Intent classification taxonomy',
        mimeType: 'application/json',
      },
      {
        uri: 'pde://templates/workflow-stages',
        name: 'Workflow Stage Templates',
        description: 'Standard workflow stage templates',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'pde://ceremonies/medicine-wheel':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                directions: DIRECTION_METADATA,
                cyclePattern: ['EAST', 'SOUTH', 'WEST', 'NORTH'],
                spiralProgression: true,
              },
              null,
              2
            ),
          },
        ],
      };

    case 'pde://schemas/intent-types':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ intentVerbs: INTENT_VERBS }, null, 2),
          },
        ],
      };

    case 'pde://templates/workflow-stages':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                templates: {
                  'standard-development': {
                    description: 'Standard software development workflow',
                    stages: [
                      { direction: 'EAST', name: 'Requirements Analysis', purpose: 'Extract and clarify requirements' },
                      { direction: 'SOUTH', name: 'Implementation', purpose: 'Build core functionality' },
                      { direction: 'WEST', name: 'Validation', purpose: 'Test and validate implementation' },
                      { direction: 'NORTH', name: 'Completion', purpose: 'Deploy and document' },
                    ],
                  },
                },
              },
              null,
              2
            ),
          },
        ],
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// ============================================================================
// Prompts Handler
// ============================================================================

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'pde-intent-extraction',
        description: 'Guide Layer 1 intent extraction from user prompt',
        arguments: [
          { name: 'userPrompt', description: 'The prompt to analyze', required: true },
        ],
      },
      {
        name: 'pde-dependency-analysis',
        description: 'Guide Layer 2 dependency graph construction',
        arguments: [
          { name: 'intentsJson', description: 'JSON of extracted intents', required: true },
        ],
      },
      {
        name: 'pde-wheel-assignment',
        description: 'Guide Layer 3 Medicine Wheel direction assignment',
        arguments: [
          { name: 'intentsJson', description: 'JSON of extracted intents', required: true },
          { name: 'dependencyGraphJson', description: 'JSON of dependency graph', required: true },
        ],
      },
      {
        name: 'pde-workflow-generation',
        description: 'Guide Layer 4 workflow template generation',
        arguments: [
          { name: 'assignmentsJson', description: 'JSON of wheel assignments', required: true },
          { name: 'dependencyGraphJson', description: 'JSON of dependency graph', required: true },
        ],
      },
      {
        name: 'pde-execution-plan',
        description: 'Guide Layer 5 execution plan finalization',
        arguments: [
          { name: 'workflowJson', description: 'JSON of workflow template', required: true },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const promptTemplates: Record<string, (args: Record<string, string>) => { messages: Array<{ role: string; content: { type: string; text: string } }> }> = {
    'pde-intent-extraction': (a) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are an intent extraction specialist. Analyze the following user request with precision.

## User Request
"${a.userPrompt}"

## Your Task

### Step 1: Explicit Intent Identification
For each explicit action, extract:
- Action: The verb/operation
- Target: What is being acted upon
- Parameters: Constraints or values
- Type: CREATION | MODIFICATION | ANALYSIS | VALIDATION | INTEGRATION | COMMUNICATION

### Step 2: Implicit Intent Discovery
Look for hidden requirements signaled by:
- "which I assume" → assumptions requiring validation
- "you will" → expectations without explicit instruction
- "somehow" → uncertainty markers

### Step 3: Ambiguity Detection
Flag anything underspecified or conflicting.

Output as JSON: { explicitIntents: [...], implicitIntents: [...], ambiguities: [...] }`,
          },
        },
      ],
    }),

    'pde-dependency-analysis': (a) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a dependency analysis specialist.

## Intents to Analyze
${a.intentsJson}

## Analysis Framework

### Step 1: Data Flow Analysis
For each intent, identify inputs required, outputs produced, state dependencies.

### Step 2: Temporal Dependencies
Determine: must-precede, must-follow, no constraint.

### Step 3: Parallelization Opportunities
Identify intents that can execute simultaneously.

Output as JSON: { nodes: [...], edges: [...], parallelGroups: [...], criticalPath: [...], hasCycles: boolean }`,
          },
        },
      ],
    }),

    'pde-wheel-assignment': (a) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a ceremonial alignment specialist.

## Medicine Wheel Directions
- EAST (Nitsáhákees): Vision, inquiry, exploration
- SOUTH (Nahat'á): Planning, implementation, building
- WEST (Iina): Integration, validation, testing
- NORTH (Siihasin): Wisdom, completion, deployment

## Intents
${a.intentsJson}

## Dependency Graph
${a.dependencyGraphJson}

Assign each intent to a direction based on its action type.

Output as JSON: { assignments: [...], stageGrouping: { EAST: [...], SOUTH: [...], WEST: [...], NORTH: [...] } }`,
          },
        },
      ],
    }),

    'pde-workflow-generation': (a) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a workflow architect.

## Assignments
${a.assignmentsJson}

## Dependency Graph
${a.dependencyGraphJson}

Generate a structured execution workflow with stages for each Medicine Wheel direction.

Output as JSON: { workflowId: "...", overallIntention: "...", stages: [...] }`,
          },
        },
      ],
    }),

    'pde-execution-plan': (a) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are an execution planning specialist.

## Workflow
${a.workflowJson}

Finalize into an execution plan with:
- Agent commands
- Success criteria
- Recovery strategies
- Checkpoint data

Output as JSON: { planId: "...", workflowId: "...", tasks: [...], metadata: {...} }`,
          },
        },
      ],
    }),
  };

  const templateFn = promptTemplates[name];
  if (!templateFn) {
    throw new Error(`Unknown prompt: ${name}`);
  }

  return templateFn(args || {});
});

// ============================================================================
// Server Startup
// ============================================================================

export async function startServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PDE MCP Server started');
}

export { server, engine };
