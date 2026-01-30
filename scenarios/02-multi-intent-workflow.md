# Scenario 02: Multi-Intent Workflow

## Objective
Test that a complex, multi-intent prompt is correctly decomposed with proper dependency management and parallel execution detection.

## Scenario Description
A developer provides a complex request containing multiple actions that need to be:
- Correctly identified as separate intents
- Properly sequenced based on dependencies
- Grouped for potential parallel execution

## Input Prompt
```
Create a REST API with user authentication using JWT, connect to PostgreSQL database, write comprehensive tests, and deploy to staging environment
```

## Expected Behavior

### 1. Intent Extraction (Layer 1)
The PDE should extract multiple intents:

| Intent | Action | Target | Type |
|--------|--------|--------|------|
| 1 | create | API | CREATION |
| 2 | (auth) | authentication | CREATION |
| 3 | connect | PostgreSQL | INTEGRATION |
| 4 | write | tests | CREATION |
| 5 | deploy | staging | COMMUNICATION |

### 2. Dependency Graph (Layer 2)
Expected dependencies:
```
create API → connect PostgreSQL → write tests → deploy
         ↘ create auth (parallel with connect)
```

### 3. Direction Assignment (Layer 3)
- CREATION intents → SOUTH
- INTEGRATION → WEST
- DEPLOYMENT → NORTH

### 4. Workflow Structure (Layer 4)
Expected stages:
```
Stage: SOUTH - Planning & Growth
  [Parallel possible]
  - [ ] Create REST API structure
  - [ ] Implement JWT authentication

Stage: WEST - Living & Action
  - [ ] Connect to PostgreSQL database
  - [ ] Write comprehensive tests

Stage: NORTH - Assurance & Reflection
  - [ ] Deploy to staging environment
```

## Test Steps for LLM Agent

1. **Call pde_decompose tool**
   ```
   Use tool: pde_decompose
   Arguments: { 
     "prompt": "Create a REST API with user authentication using JWT, connect to PostgreSQL database, write comprehensive tests, and deploy to staging environment"
   }
   ```

2. **Verify Intent Count**
   - [ ] `metadata.totalTasks` >= 4
   - [ ] Multiple stages exist

3. **Verify Stage Order**
   - [ ] SOUTH stage comes before WEST
   - [ ] WEST stage comes before NORTH
   - [ ] Ceremonial cycle is respected

4. **Check Parallel Opportunities**
   - [ ] `metadata.parallelizableTasks` > 0
   - [ ] SOUTH stage has `executionType: 'parallel'` or multiple tasks

5. **Verify Dependencies**
   - [ ] Deploy task depends on test task
   - [ ] No circular dependencies (`hasCycles: false` in graph)

6. **Validate Complexity**
   - [ ] `metadata.estimatedComplexity` is 'medium' or 'high'

## Success Criteria

- ✅ 4+ intents correctly extracted
- ✅ All four Medicine Wheel directions represented
- ✅ Proper dependency ordering (create → integrate → test → deploy)
- ✅ Parallel execution opportunities identified
- ✅ No circular dependencies
- ✅ Plan validation passes

## Common Issues

1. **Missing Implicit Intents**: "with JWT" should trigger auth-related tasks
2. **Wrong Direction**: Deployment should be NORTH, not SOUTH
3. **Broken Dependencies**: Tests should not run before API is created
4. **No Parallelization**: Independent CREATION tasks should be parallelizable

## Advanced Verification

Check the dependency graph structure:
```
Use resource: pde://ceremonies/medicine-wheel
```

Verify that the workflow follows the natural cycle:
EAST (exploration) → SOUTH (creation) → WEST (validation) → NORTH (completion)
