#!/usr/bin/env node
/**
 * PDE-MCP v2 Entry Point
 * Starts the Model Context Protocol server for Prompt Decomposition Engine.
 * 
 * Also re-exports core engine, parser, prompts, storage for programmatic use.
 * CLI: ./cli.ts (bin: mcp-pde)
 */

import { startServer } from './mcp-server.js';

startServer().catch((error) => {
  console.error('Failed to start PDE MCP server:', error);
  process.exit(1);
});

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
