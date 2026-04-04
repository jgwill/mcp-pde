/**
 * MCP Server for PDE v2
 * 
 * Implements Model Context Protocol server with LLM-driven Prompt Decomposition Engine.
 * 
 * Tools:
 *   pde_decompose     - Build system prompt for LLM decomposition, or parse LLM response
 *   pde_parse_response - Parse an LLM response into DecompositionResult and store it
 *   pde_get            - Retrieve a stored decomposition by ID
 *   pde_list           - List stored decompositions
 *   pde_export_markdown - Export a decomposition as markdown
 * 
 * Resources:
 *   pde://schema/decomposition-result - The DecompositionResult JSON schema
 *   pde://directions                  - Four Directions metadata
 * 
 * Prompts:
 *   pde-decompose - The system prompt for LLM-driven decomposition
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
  type GetDecompositionInput,
  type ListDecompositionsInput,
  type ExportMarkdownInput,
  DIRECTION_META,
  DIRECTIONS,
  DEFAULT_OPTIONS,
} from './types.js';
import { buildSystemPrompt, formatUserMessage } from './prompts.js';

const engine = new PdeEngine();

const server = new Server(
  { name: 'pde-mcp', version: '2.0.0' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);

// ============================================================================
// Tools
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'pde_decompose',
      description: 'Build system prompt + user message for LLM-driven prompt decomposition. Send the returned systemPrompt and userMessage to your LLM, then call pde_parse_response with the result.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'The complex prompt to decompose' },
          options: {
            type: 'object',
            properties: {
              extractImplicit: { type: 'boolean', default: true, description: 'Extract implicit intents from hedging language' },
              mapDependencies: { type: 'boolean', default: true, description: 'Map dependencies between actions' },
            },
          },
          parent_pde_id: { type: 'string', description: 'UUID of parent PDE for parent-child nesting' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'pde_parse_response',
      description: 'Parse an LLM response (from pde_decompose prompt) into structured DecompositionResult JSON and store it in .pde/ folder.',
      inputSchema: {
        type: 'object',
        properties: {
          llm_response: { type: 'string', description: 'The raw LLM response text containing the DecompositionResult JSON' },
          original_prompt: { type: 'string', description: 'The original user prompt that was decomposed' },
          workdir: { type: 'string', description: 'Working directory for .pde/ storage (defaults to cwd)' },
          parent_pde_id: { type: 'string', description: 'UUID of parent PDE for parent-child nesting' },
          options: {
            type: 'object',
            properties: {
              extractImplicit: { type: 'boolean', default: true },
              mapDependencies: { type: 'boolean', default: true },
            },
          },
        },
        required: ['llm_response', 'original_prompt'],
      },
    },
    {
      name: 'pde_get',
      description: 'Retrieve a stored decomposition by ID from .pde/ folder',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Decomposition ID' },
          workdir: { type: 'string', description: 'Working directory' },
        },
        required: ['id'],
      },
    },
    {
      name: 'pde_list',
      description: 'List stored decompositions from .pde/ folder',
      inputSchema: {
        type: 'object',
        properties: {
          workdir: { type: 'string', description: 'Working directory' },
          limit: { type: 'number', default: 10 },
          parent_id: { type: 'string', description: 'Filter to children of a specific parent PDE UUID' },
        },
      },
    },
    {
      name: 'pde_export_markdown',
      description: 'Export a stored decomposition as a git-diffable markdown document with Four Directions headers',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Decomposition ID' },
          workdir: { type: 'string', description: 'Working directory' },
        },
        required: ['id'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'pde_decompose': {
        const input = args as unknown as DecomposeInput;
        if (!input?.prompt) {
          return { content: [{ type: 'text', text: 'Missing required parameter: prompt' }], isError: true };
        }
        const { systemPrompt, userMessage } = engine.buildPrompt(input.prompt, input.options);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              instructions: 'Send systemPrompt as system message and userMessage as user message to your LLM. Then call pde_parse_response with the LLM output.',
              systemPrompt,
              userMessage,
              original_prompt: input.prompt,
              ...(input.parent_pde_id ? { parent_pde_id: input.parent_pde_id } : {}),
            }, null, 2),
          }],
        };
      }

      case 'pde_parse_response': {
        const { llm_response, original_prompt, workdir, options, parent_pde_id } = args as {
          llm_response: string;
          original_prompt: string;
          workdir?: string;
          options?: { extractImplicit?: boolean; mapDependencies?: boolean };
          parent_pde_id?: string;
        };
        if (!llm_response || !original_prompt) {
          return { content: [{ type: 'text', text: 'Missing required: llm_response and original_prompt' }], isError: true };
        }
        const stored = engine.parseAndStore(llm_response, original_prompt, options, workdir, parent_pde_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(stored, null, 2) }],
        };
      }

      case 'pde_get': {
        const { id, workdir } = args as unknown as GetDecompositionInput;
        const stored = engine.get(id, workdir);
        if (!stored) {
          return { content: [{ type: 'text', text: `Decomposition ${id} not found` }], isError: true };
        }
        return { content: [{ type: 'text', text: JSON.stringify(stored, null, 2) }] };
      }

      case 'pde_list': {
        const { workdir, limit, parent_id } = (args || {}) as ListDecompositionsInput;
        const items = parent_id
          ? engine.listChildren(parent_id, workdir)
          : engine.list(workdir, limit);
        const limited = limit && !parent_id ? items.slice(0, limit) : items;
        const summary = limited.map(d => ({
          id: d.id,
          timestamp: d.timestamp,
          primaryAction: `${d.result.primary.action} ${d.result.primary.target}`,
          secondaryCount: d.result.secondary.length,
          ambiguityCount: d.result.ambiguities.length,
          actionStackCount: d.result.actionStack.length,
          ...(d.parent_pde_id ? { parent_pde_id: d.parent_pde_id } : {}),
          ...(d.folder_name ? { folder_name: d.folder_name } : {}),
        }));
        return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
      }

      case 'pde_export_markdown': {
        const { id, workdir } = args as unknown as ExportMarkdownInput;
        const md = engine.exportMarkdown(id, workdir);
        if (!md) {
          return { content: [{ type: 'text', text: `Decomposition ${id} not found` }], isError: true };
        }
        return { content: [{ type: 'text', text: md }] };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

// ============================================================================
// Resources
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'pde://schema/decomposition-result',
      name: 'DecompositionResult Schema',
      description: 'The canonical JSON schema for prompt decomposition output (primary/secondary intents, context, directions, action stack, ambiguities)',
      mimeType: 'application/json',
    },
    {
      uri: 'pde://directions',
      name: 'Four Directions',
      description: 'Medicine Wheel direction metadata: EAST=Vision, SOUTH=Analysis, WEST=Validation, NORTH=Action',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  switch (uri) {
    case 'pde://schema/decomposition-result':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            description: 'DecompositionResult — the output of PDE prompt decomposition',
            schema: {
              primary: { action: 'string', target: 'string', urgency: 'immediate|session|persistent', confidence: '0.0-1.0' },
              secondary: [{ action: 'string', target: 'string', implicit: 'boolean', dependency: 'string|null', confidence: '0.0-1.0' }],
              context: { files_needed: ['string'], tools_required: ['string'], assumptions: ['string'] },
              outputs: { artifacts: ['string'], updates: ['string'], communications: ['string'] },
              directions: { east: [{ text: 'string', confidence: '0.0-1.0', implicit: 'boolean' }], south: '...', west: '...', north: '...' },
              actionStack: [{ text: 'string', direction: 'east|south|west|north', dependency: 'string|null', completed: 'boolean' }],
              ambiguities: [{ text: 'string', suggestion: 'string' }],
            },
          }, null, 2),
        }],
      };

    case 'pde://directions':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(DIRECTION_META, null, 2),
        }],
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// ============================================================================
// Prompts
// ============================================================================

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'pde-decompose',
      description: 'System prompt for LLM-driven prompt decomposition. Returns system + user messages to send to your LLM.',
      arguments: [
        { name: 'userPrompt', description: 'The prompt to decompose', required: true },
        { name: 'extractImplicit', description: 'Extract implicit intents (default: true)', required: false },
        { name: 'mapDependencies', description: 'Map dependencies (default: true)', required: false },
      ],
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: promptArgs } = request.params;

  if (name !== 'pde-decompose') {
    throw new Error(`Unknown prompt: ${name}`);
  }

  const opts = {
    extractImplicit: promptArgs?.extractImplicit !== 'false',
    mapDependencies: promptArgs?.mapDependencies !== 'false',
  };

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `${buildSystemPrompt(opts)}\n\n${formatUserMessage(promptArgs?.userPrompt || '')}`,
        },
      },
    ],
  };
});

// ============================================================================
// Server Startup
// ============================================================================

export async function startServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PDE MCP Server v2 started');
}

export { server, engine };
