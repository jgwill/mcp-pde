/**
 * PDE-MCP v2 — Library Entry Point
 *
 * Re-exports core engine, parser, prompts, storage for programmatic use.
 * CLI: ./cli.ts (bin: mcp-pde)
 * MCP: startServer() or `mcp-pde serve`
 */

// Re-export for library usage
export { PdeEngine, PDEParseError } from './pde-engine.js';
export { parseDecompositionResponse, actionStackToMarkdown } from './parser.js';
export { buildSystemPrompt, formatUserMessage } from './prompts.js';
export { saveDecomposition, loadDecomposition, listDecompositions, decompositionToMarkdown } from './storage.js';
export { startServer } from './mcp-server.js';
export type {
  DecompositionResult,
  DecompositionOptions,
  PrimaryIntent,
  SecondaryIntent,
  ContextRequirements,
  ExpectedOutputs,
  Direction,
  DirectionItem,
  DirectionMap,
  ActionItem,
  AmbiguityFlag,
  StoredDecomposition,
} from './types.js';
