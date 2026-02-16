/**
 * MCP Tools Tests (v2)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { engine } from '../src/mcp-server.js';
import { DIRECTION_META, DIRECTIONS } from '../src/types.js';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import os from 'os';

// Sample LLM response
const SAMPLE_RESPONSE = JSON.stringify({
  primary: { action: "create", target: "user management system", urgency: "session", confidence: 0.9 },
  secondary: [{ action: "implement", target: "authentication", implicit: false, dependency: null, confidence: 0.8 }],
  context: { files_needed: ["src/auth/"], tools_required: ["database"], assumptions: [] },
  outputs: { artifacts: ["src/auth/index.ts"], updates: [], communications: [] },
  directions: {
    east: [{ text: "Understand auth requirements", confidence: 0.9, implicit: false }],
    south: [{ text: "Research auth patterns", confidence: 0.8, implicit: true }],
    west: [], north: [],
  },
  actionStack: [{ text: "Create auth module", direction: "south", dependency: null, completed: false }],
  ambiguities: [{ text: "authentication type", suggestion: "Specify OAuth, JWT, or session-based" }],
});

describe('MCP Tools', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(os.tmpdir(), `pde-mcp-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  describe('pde_decompose (buildPrompt)', () => {
    it('should build system prompt and user message', () => {
      const { systemPrompt, userMessage } = engine.buildPrompt('Create a user management system with authentication');
      expect(systemPrompt).toContain('Prompt Decomposition Engine');
      expect(systemPrompt).toContain('EAST');
      expect(userMessage).toContain('Create a user management system');
    });

    it('should handle options', () => {
      const result = engine.buildPrompt('Refactor the auth module', { extractImplicit: false });
      expect(result.systemPrompt).toContain('Only extract explicit intents');
    });
  });

  describe('pde_parse_response + pde_get', () => {
    it('should parse response and retrieve stored result', () => {
      const stored = engine.parseAndStore(SAMPLE_RESPONSE, 'Build a dashboard', undefined, testDir);
      expect(stored).toBeDefined();
      expect(stored.id).toBeDefined();
      expect(stored.result.primary.action).toBe('create');

      const retrieved = engine.get(stored.id, testDir);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(stored.id);
    });

    it('should return null for non-existent plan', () => {
      const retrieved = engine.get('fake-id', testDir);
      expect(retrieved).toBeNull();
    });
  });

  describe('pde_list', () => {
    it('should list decompositions', () => {
      engine.parseAndStore(SAMPLE_RESPONSE, 'Test 1', undefined, testDir);
      engine.parseAndStore(SAMPLE_RESPONSE, 'Test 2', undefined, testDir);
      const items = engine.list(testDir);
      expect(items.length).toBeGreaterThanOrEqual(2);
    });

    it('should respect limit', () => {
      engine.parseAndStore(SAMPLE_RESPONSE, 'Test 1', undefined, testDir);
      engine.parseAndStore(SAMPLE_RESPONSE, 'Test 2', undefined, testDir);
      const items = engine.list(testDir, 1);
      expect(items.length).toBeLessThanOrEqual(1);
    });
  });

  describe('pde_export_markdown', () => {
    it('should export markdown with directions', () => {
      const stored = engine.parseAndStore(SAMPLE_RESPONSE, 'Test prompt', undefined, testDir);
      const md = engine.exportMarkdown(stored.id, testDir);
      expect(md).not.toBeNull();
      expect(md).toContain('# Prompt Decomposition');
      expect(md).toContain('EAST');
      expect(md).toContain('Primary Intent');
    });
  });
});

describe('MCP Resources', () => {
  describe('direction metadata', () => {
    it('should have all four directions defined', () => {
      expect(DIRECTION_META.east).toBeDefined();
      expect(DIRECTION_META.south).toBeDefined();
      expect(DIRECTION_META.west).toBeDefined();
      expect(DIRECTION_META.north).toBeDefined();
    });

    it('should have names and emojis for each direction', () => {
      expect(DIRECTION_META.east.name).toBe('VISION');
      expect(DIRECTION_META.south.name).toBe('ANALYSIS');
      expect(DIRECTION_META.west.name).toBe('VALIDATION');
      expect(DIRECTION_META.north.name).toBe('ACTION');
      expect(DIRECTION_META.east.emoji).toBe('🌅');
    });
  });

  describe('directions constant', () => {
    it('should have four directions in order', () => {
      expect(DIRECTIONS).toEqual(['east', 'south', 'west', 'north']);
    });
  });
});
