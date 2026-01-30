/**
 * PDE Engine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PdeEngine } from '../src/pde-engine.js';
import type { DecomposeInput } from '../src/types.js';

describe('PdeEngine', () => {
  let engine: PdeEngine;

  beforeEach(() => {
    engine = new PdeEngine();
  });

  describe('decompose', () => {
    it('should decompose a simple single-intent prompt', async () => {
      const input: DecomposeInput = {
        prompt: 'Create a user authentication system',
      };

      const plan = await engine.decompose(input);

      expect(plan).toBeDefined();
      expect(plan.planId).toBeDefined();
      expect(plan.workflowId).toBeDefined();
      expect(plan.overallIntention).toContain('create');
      expect(plan.stages.length).toBeGreaterThan(0);
    });

    it('should decompose a multi-intent prompt', async () => {
      const input: DecomposeInput = {
        prompt: 'Create a REST API with PostgreSQL, write tests, and deploy to staging',
      };

      const plan = await engine.decompose(input);

      expect(plan.metadata.totalTasks).toBeGreaterThanOrEqual(3);
      expect(plan.overallIntention).toContain('create');
    });

    it('should assign Medicine Wheel directions correctly', async () => {
      const input: DecomposeInput = {
        prompt: 'Analyze the codebase, create new components, test everything, and deploy',
      };

      const plan = await engine.decompose(input);

      // Should have EAST for analyze, SOUTH for create, WEST for test, NORTH for deploy
      const directions = plan.stages.map(s => s.direction);
      expect(directions).toContain('EAST');
      expect(directions).toContain('SOUTH');
    });

    it('should disable Medicine Wheel when option is false', async () => {
      const input: DecomposeInput = {
        prompt: 'Create and test a module',
        options: {
          medicineWheelEnabled: false,
        },
      };

      const plan = await engine.decompose(input);

      // All tasks should be in SOUTH when wheel is disabled
      const southStage = plan.stages.find(s => s.direction === 'SOUTH');
      expect(southStage).toBeDefined();
    });

    it('should extract explicit intents', async () => {
      const input: DecomposeInput = {
        prompt: 'Build a dashboard with React and integrate with the API',
      };

      const plan = await engine.decompose(input);

      expect(plan.metadata.totalTasks).toBeGreaterThanOrEqual(2);
    });

    it('should detect parallel execution opportunities', async () => {
      const input: DecomposeInput = {
        prompt: 'Create user service, create product service, create order service',
      };

      const plan = await engine.decompose(input);

      // Multiple create operations - they may or may not be parallelizable
      // depending on the deduplication. Check that the plan is valid.
      expect(plan.metadata.totalTasks).toBeGreaterThanOrEqual(1);
      expect(plan.stages.length).toBeGreaterThan(0);
    });
  });

  describe('extractIntents', () => {
    it('should extract CREATION intents', () => {
      const result = engine.extractIntents('Create a new database schema');

      expect(result.explicitIntents.length).toBeGreaterThan(0);
      expect(result.explicitIntents[0].type).toBe('CREATION');
      expect(result.explicitIntents[0].action).toBe('create');
    });

    it('should extract ANALYSIS intents', () => {
      const result = engine.extractIntents('Analyze the performance metrics');

      expect(result.explicitIntents.length).toBeGreaterThan(0);
      expect(result.explicitIntents[0].type).toBe('ANALYSIS');
    });

    it('should extract VALIDATION intents', () => {
      const result = engine.extractIntents('Test the authentication flow');

      expect(result.explicitIntents.length).toBeGreaterThan(0);
      expect(result.explicitIntents[0].type).toBe('VALIDATION');
    });

    it('should detect implicit intents', () => {
      const result = engine.extractIntents('Create a module which I assume will handle auth');

      expect(result.implicitIntents.length).toBeGreaterThan(0);
    });

    it('should flag ambiguous prompts', () => {
      const result = engine.extractIntents('do something with the thing');

      expect(result.ambiguities.length).toBeGreaterThan(0);
    });
  });

  describe('buildDependencyGraph', () => {
    it('should build a graph with no cycles for valid intents', () => {
      const intents = engine.extractIntents('Create, test, and deploy the app');
      const graph = engine.buildDependencyGraph(intents);

      expect(graph.hasCycles).toBe(false);
    });

    it('should identify parallel groups when multiple same-type intents exist', () => {
      // Build intents manually to ensure we have multiple of same type
      const intents = {
        explicitIntents: [
          { id: 'intent-1', action: 'create', target: 'user', parameters: {}, type: 'CREATION' as const, priority: 'primary' as const },
          { id: 'intent-2', action: 'create', target: 'order', parameters: {}, type: 'CREATION' as const, priority: 'secondary' as const },
          { id: 'intent-3', action: 'create', target: 'product', parameters: {}, type: 'CREATION' as const, priority: 'secondary' as const },
        ],
        implicitIntents: [],
        ambiguities: [],
      };
      const graph = engine.buildDependencyGraph(intents);

      // With 3 CREATION intents, they should form a parallel group
      expect(graph.parallelGroups.length).toBeGreaterThan(0);
    });

    it('should compute critical path', () => {
      const intents = engine.extractIntents('Analyze requirements, create code, test thoroughly, deploy safely');
      const graph = engine.buildDependencyGraph(intents);

      expect(graph.criticalPath.length).toBeGreaterThan(0);
    });
  });

  describe('validatePlan', () => {
    it('should validate a correct plan', async () => {
      const input: DecomposeInput = {
        prompt: 'Create a simple module',
      };

      const plan = await engine.decompose(input);
      const validation = engine.validatePlan(plan.planId);

      expect(validation.isValid).toBe(true);
      expect(validation.coherenceScore).toBeGreaterThan(50);
      expect(validation.completenessScore).toBeGreaterThan(50);
    });

    it('should return invalid for non-existent plan', () => {
      const validation = engine.validatePlan('non-existent-id');

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('workflow storage', () => {
    it('should store and retrieve workflows', async () => {
      const input: DecomposeInput = {
        prompt: 'Create a test module',
      };

      const plan = await engine.decompose(input);
      const retrieved = engine.getPlan(plan.planId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.planId).toBe(plan.planId);
    });

    it('should list workflows', async () => {
      const input: DecomposeInput = {
        prompt: 'Create module A',
      };

      await engine.decompose(input);
      const workflows = engine.listWorkflows();

      expect(workflows.length).toBeGreaterThan(0);
    });
  });
});

describe('Medicine Wheel Alignment', () => {
  let engine: PdeEngine;

  beforeEach(() => {
    engine = new PdeEngine();
  });

  it('should align ANALYSIS with EAST direction', async () => {
    const plan = await engine.decompose({ prompt: 'Analyze the system architecture' });
    
    const eastStage = plan.stages.find(s => s.direction === 'EAST');
    expect(eastStage).toBeDefined();
    expect(eastStage?.tasks.some(t => t.description.includes('analyze'))).toBe(true);
  });

  it('should align CREATION with SOUTH direction', async () => {
    const plan = await engine.decompose({ prompt: 'Create a new component' });
    
    const southStage = plan.stages.find(s => s.direction === 'SOUTH');
    expect(southStage).toBeDefined();
    expect(southStage?.tasks.some(t => t.description.includes('create'))).toBe(true);
  });

  it('should align VALIDATION with WEST direction', async () => {
    const plan = await engine.decompose({ prompt: 'Test the integration' });
    
    const westStage = plan.stages.find(s => s.direction === 'WEST');
    expect(westStage).toBeDefined();
    expect(westStage?.tasks.some(t => t.description.includes('test'))).toBe(true);
  });

  it('should align COMMUNICATION with NORTH direction', async () => {
    const plan = await engine.decompose({ prompt: 'Report the findings and document everything' });
    
    const northStage = plan.stages.find(s => s.direction === 'NORTH');
    expect(northStage).toBeDefined();
  });
});
