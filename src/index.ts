#!/usr/bin/env node
/**
 * PDE-MCP Entry Point
 * Starts the Model Context Protocol server for Prompt Decomposition Engine
 */

import { startServer } from './mcp-server.js';

startServer().catch((error) => {
  console.error('Failed to start PDE MCP server:', error);
  process.exit(1);
});
