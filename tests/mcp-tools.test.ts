/**
 * MCP Tools Tests
 */

import { describe, it, expect } from 'vitest';
import { engine } from '../src/mcp-server.js';
import { DIRECTION_METADATA, INTENT_VERBS } from '../src/types.js';

describe('MCP Tools', () => {
  describe('pde_decompose', () => {
    it('should decompose a prompt via engine', async () => {
      const plan = await engine.decompose({
        prompt: 'Create a user management system with authentication',
      });

      expect(plan).toBeDefined();
      expect(plan.planId).toBeDefined();
      expect(plan.stages.length).toBeGreaterThan(0);
      expect(plan.metadata.totalTasks).toBeGreaterThan(0);
    });

    it('should handle context files', async () => {
      const plan = await engine.decompose({
        prompt: 'Refactor the auth module',
        context: {
          files: ['src/auth/index.ts', 'src/auth/types.ts'],
        },
      });

      expect(plan).toBeDefined();
    });
  });

  describe('pde_get_plan', () => {
    it('should retrieve a stored plan', async () => {
      const plan = await engine.decompose({
        prompt: 'Build a dashboard',
      });

      const retrieved = engine.getPlan(plan.planId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.planId).toBe(plan.planId);
    });

    it('should return undefined for non-existent plan', () => {
      const retrieved = engine.getPlan('fake-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('pde_validate_plan', () => {
    it('should validate a plan', async () => {
      const plan = await engine.decompose({
        prompt: 'Create and test a module',
      });

      const validation = engine.validatePlan(plan.planId);
      expect(validation.isValid).toBe(true);
      expect(validation.coherenceScore).toBeGreaterThanOrEqual(0);
      expect(validation.completenessScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('pde_list_workflows', () => {
    it('should list workflows', async () => {
      await engine.decompose({ prompt: 'Test workflow 1' });
      await engine.decompose({ prompt: 'Test workflow 2' });

      const workflows = engine.listWorkflows('all', 10);
      expect(workflows.length).toBeGreaterThanOrEqual(2);
    });

    it('should respect limit', async () => {
      const workflows = engine.listWorkflows('all', 1);
      expect(workflows.length).toBeLessThanOrEqual(1);
    });
  });
});

describe('MCP Resources', () => {
  describe('medicine-wheel resource', () => {
    it('should have all four directions defined', () => {
      expect(DIRECTION_METADATA.EAST).toBeDefined();
      expect(DIRECTION_METADATA.SOUTH).toBeDefined();
      expect(DIRECTION_METADATA.WEST).toBeDefined();
      expect(DIRECTION_METADATA.NORTH).toBeDefined();
    });

    it('should have ceremony types for each direction', () => {
      expect(DIRECTION_METADATA.EAST.ceremonyType).toBe('vision_inquiry');
      expect(DIRECTION_METADATA.SOUTH.ceremonyType).toBe('wave_counting');
      expect(DIRECTION_METADATA.WEST.ceremonyType).toBe('talking_circles');
      expect(DIRECTION_METADATA.NORTH.ceremonyType).toBe('elder_council');
    });
  });

  describe('intent-types resource', () => {
    it('should have verb mappings for each intent type', () => {
      expect(INTENT_VERBS.CREATION).toBeDefined();
      expect(INTENT_VERBS.CREATION).toContain('create');
      expect(INTENT_VERBS.ANALYSIS).toContain('analyze');
      expect(INTENT_VERBS.VALIDATION).toContain('test');
    });
  });
});
