/**
 * PDE Engine v2 Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PdeEngine } from '../src/pde-engine.js';
import { parseDecompositionResponse, actionStackToMarkdown, PDEParseError } from '../src/parser.js';
import { buildSystemPrompt, formatUserMessage } from '../src/prompts.js';
import { decompositionToMarkdown, saveDecomposition, loadDecomposition, listDecompositions } from '../src/storage.js';
import { DEFAULT_OPTIONS, DIRECTION_META, DIRECTIONS } from '../src/types.js';
import type { DecompositionResult } from '../src/types.js';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import os from 'os';

// Sample LLM response that matches the DecompositionResult schema
const SAMPLE_LLM_RESPONSE = JSON.stringify({
  primary: {
    action: "create",
    target: "user authentication system",
    urgency: "session",
    confidence: 0.9,
  },
  secondary: [
    {
      action: "implement",
      target: "OAuth support",
      implicit: false,
      dependency: "create user authentication system",
      confidence: 0.85,
    },
    {
      action: "add",
      target: "rate limiting",
      implicit: true,
      dependency: "create user authentication system",
      confidence: 0.6,
    },
  ],
  context: {
    files_needed: ["src/auth/", "src/middleware/"],
    tools_required: ["database", "OAuth provider"],
    assumptions: ["Rate limiting is needed based on 'which I assume'"],
  },
  outputs: {
    artifacts: ["src/auth/oauth.ts", "src/middleware/rateLimit.ts"],
    updates: ["database schema"],
    communications: ["API documentation update"],
  },
  directions: {
    east: [{ text: "Understand OAuth requirements", confidence: 0.9, implicit: false }],
    south: [{ text: "Research OAuth providers", confidence: 0.8, implicit: true }],
    west: [{ text: "Validate rate limiting approach", confidence: 0.7, implicit: true }],
    north: [{ text: "Implement authentication system", confidence: 0.9, implicit: false }],
  },
  actionStack: [
    { text: "Set up auth module structure", direction: "east", dependency: null, completed: false },
    { text: "Implement OAuth flow", direction: "south", dependency: "Set up auth module structure", completed: false },
    { text: "Add rate limiting middleware", direction: "south", dependency: "Implement OAuth flow", completed: false },
    { text: "Write integration tests", direction: "west", dependency: "Add rate limiting middleware", completed: false },
    { text: "Update API docs", direction: "north", dependency: "Write integration tests", completed: false },
  ],
  ambiguities: [
    { text: "which I assume needs rate limiting", suggestion: "Clarify rate limiting requirements: requests per second, per user or global?" },
    { text: "somehow", suggestion: "Specify the database schema update method" },
  ],
});

describe('PdeEngine', () => {
  let engine: PdeEngine;
  let testDir: string;

  beforeEach(() => {
    testDir = join(os.tmpdir(), `pde-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    engine = new PdeEngine(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('buildPrompt', () => {
    it('should return systemPrompt and userMessage', () => {
      const result = engine.buildPrompt('Create a user auth system');
      expect(result.systemPrompt).toContain('Prompt Decomposition Engine');
      expect(result.systemPrompt).toContain('EAST');
      expect(result.systemPrompt).toContain('implicit');
      expect(result.userMessage).toContain('Create a user auth system');
    });

    it('should respect extractImplicit option', () => {
      const withImplicit = engine.buildPrompt('test', { extractImplicit: true });
      const withoutImplicit = engine.buildPrompt('test', { extractImplicit: false });
      expect(withImplicit.systemPrompt).toContain('Extract implicit intents');
      expect(withoutImplicit.systemPrompt).toContain('Only extract explicit intents');
    });
  });

  describe('parseAndStore', () => {
    it('should parse LLM response and store in .pde/', () => {
      const stored = engine.parseAndStore(SAMPLE_LLM_RESPONSE, 'Create a user auth system');
      expect(stored.id).toBeDefined();
      expect(stored.result.primary.action).toBe('create');
      expect(stored.result.secondary).toHaveLength(2);
      expect(stored.result.ambiguities).toHaveLength(2);
      expect(stored.result.actionStack).toHaveLength(5);
      // Check files exist
      expect(existsSync(join(testDir, '.pde', `${stored.id}.json`))).toBe(true);
      expect(existsSync(join(testDir, '.pde', `${stored.id}.md`))).toBe(true);
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const wrapped = '```json\n' + SAMPLE_LLM_RESPONSE + '\n```';
      const stored = engine.parseAndStore(wrapped, 'test prompt');
      expect(stored.result.primary.action).toBe('create');
    });
  });

  describe('get and list', () => {
    it('should retrieve a stored decomposition', () => {
      const stored = engine.parseAndStore(SAMPLE_LLM_RESPONSE, 'test');
      const retrieved = engine.get(stored.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(stored.id);
      expect(retrieved!.result.primary.action).toBe('create');
    });

    it('should return null for non-existent ID', () => {
      expect(engine.get('non-existent')).toBeNull();
    });

    it('should list stored decompositions', () => {
      engine.parseAndStore(SAMPLE_LLM_RESPONSE, 'test 1');
      engine.parseAndStore(SAMPLE_LLM_RESPONSE, 'test 2');
      const items = engine.list();
      expect(items.length).toBe(2);
    });

    it('should respect limit parameter', () => {
      engine.parseAndStore(SAMPLE_LLM_RESPONSE, 'test 1');
      engine.parseAndStore(SAMPLE_LLM_RESPONSE, 'test 2');
      engine.parseAndStore(SAMPLE_LLM_RESPONSE, 'test 3');
      const items = engine.list(undefined, 2);
      expect(items.length).toBe(2);
    });
  });

  describe('exportMarkdown', () => {
    it('should export markdown with Four Directions', () => {
      const stored = engine.parseAndStore(SAMPLE_LLM_RESPONSE, 'test');
      const md = engine.exportMarkdown(stored.id);
      expect(md).not.toBeNull();
      expect(md).toContain('# Prompt Decomposition');
      expect(md).toContain('EAST');
      expect(md).toContain('SOUTH');
      expect(md).toContain('WEST');
      expect(md).toContain('NORTH');
      expect(md).toContain('Primary Intent');
      expect(md).toContain('Ambiguity Flags');
      expect(md).toContain('Action Stack');
    });

    it('should return null for non-existent ID', () => {
      expect(engine.exportMarkdown('non-existent')).toBeNull();
    });
  });
});

describe('Parser', () => {
  it('should parse valid JSON response', () => {
    const result = parseDecompositionResponse(SAMPLE_LLM_RESPONSE);
    expect(result.primary.action).toBe('create');
    expect(result.secondary).toHaveLength(2);
    expect(result.ambiguities).toHaveLength(2);
  });

  it('should parse JSON in markdown code block', () => {
    const wrapped = '```json\n' + SAMPLE_LLM_RESPONSE + '\n```';
    const result = parseDecompositionResponse(wrapped);
    expect(result.primary.action).toBe('create');
  });

  it('should parse JSON with surrounding text', () => {
    const withText = 'Here is the decomposition:\n' + SAMPLE_LLM_RESPONSE + '\nDone!';
    const result = parseDecompositionResponse(withText);
    expect(result.primary.action).toBe('create');
  });

  it('should throw PDEParseError for non-JSON', () => {
    expect(() => parseDecompositionResponse('This is not JSON')).toThrow(PDEParseError);
  });

  it('should throw for missing primary field', () => {
    expect(() => parseDecompositionResponse(JSON.stringify({ secondary: [] }))).toThrow(PDEParseError);
  });

  it('should default confidence to 0.8 if missing', () => {
    const minimal = JSON.stringify({ primary: { action: 'test', target: 'thing' } });
    const result = parseDecompositionResponse(minimal);
    expect(result.primary.confidence).toBe(0.8);
    expect(result.primary.urgency).toBe('session');
  });

  it('should normalize missing arrays to empty', () => {
    const minimal = JSON.stringify({ primary: { action: 'test', target: 'thing', confidence: 0.9, urgency: 'session' } });
    const result = parseDecompositionResponse(minimal);
    expect(result.secondary).toEqual([]);
    expect(result.ambiguities).toEqual([]);
    expect(result.actionStack).toEqual([]);
    expect(result.directions.east).toEqual([]);
  });
});

describe('actionStackToMarkdown', () => {
  it('should format action stack as checklist', () => {
    const items = [
      { text: 'First task', completed: false, dependency: null },
      { text: 'Second task', completed: true, dependency: 'First task' },
    ];
    const md = actionStackToMarkdown(items);
    expect(md).toContain('- [ ] First task');
    expect(md).toContain('- [x] Second task (depends on: First task)');
  });
});

describe('Prompts', () => {
  it('should build system prompt with all components', () => {
    const prompt = buildSystemPrompt(DEFAULT_OPTIONS);
    expect(prompt).toContain('Prompt Decomposition Engine');
    expect(prompt).toContain('EAST');
    expect(prompt).toContain('implicit');
    expect(prompt).toContain('dependency');
    expect(prompt).toContain('ambiguities');
  });

  it('should format user message', () => {
    const msg = formatUserMessage('Build a chat app');
    expect(msg).toContain('Build a chat app');
  });
});

describe('Markdown Export', () => {
  it('should contain all sections', () => {
    const result = parseDecompositionResponse(SAMPLE_LLM_RESPONSE);
    const md = decompositionToMarkdown(result, 'test prompt');
    expect(md).toContain('# Prompt Decomposition');
    expect(md).toContain('## Directions');
    expect(md).toContain('## Primary Intent');
    expect(md).toContain('## Secondary Intents');
    expect(md).toContain('## Context Requirements');
    expect(md).toContain('## Four Directions Analysis');
    expect(md).toContain('## Action Stack');
    expect(md).toContain('## Ambiguity Flags');
    expect(md).toContain('## Expected Outputs');
  });

  it('should include direction emojis', () => {
    const result = parseDecompositionResponse(SAMPLE_LLM_RESPONSE);
    const md = decompositionToMarkdown(result);
    expect(md).toContain('🌅');
    expect(md).toContain('🔥');
    expect(md).toContain('🌊');
    expect(md).toContain('❄️');
  });
});
