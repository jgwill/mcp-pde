# Scenario 04: Dependency Resolution

## Objective
Test that the PDE correctly identifies and resolves dependencies between tasks, ensuring proper execution ordering and detecting potential issues like circular dependencies.

## Scenario Description
Complex workflows have tasks that depend on each other. The PDE must:
- Build accurate dependency graphs
- Identify the critical path
- Detect circular dependencies
- Enable parallel execution where safe

## Test Cases

### Case A: Linear Dependencies
```
Research best practices, then design the architecture, then implement the solution, then write tests
```

Expected Graph:
```
research → design → implement → write tests
```

### Case B: Parallel Opportunities
```
Create user service, create order service, create product service, then integrate all services
```

Expected Graph:
```
create user ─┐
create order─┼→ integrate
create product┘
```

### Case C: Mixed Dependencies
```
Analyze requirements, create database schema, create API endpoints, write unit tests, write integration tests, deploy
```

Expected Graph:
```
analyze → create schema ─→ write unit tests ─┐
                  ↓                          ├→ deploy
         create API ──→ write integration tests┘
```

## Test Steps for LLM Agent

### Test Case A: Linear Dependencies

1. **Decompose Linear Workflow**
   ```
   Use tool: pde_decompose
   Arguments: { "prompt": "Research best practices, then design the architecture, then implement the solution, then write tests" }
   ```

2. **Verify Ordering**
   - [ ] Research task has no dependencies
   - [ ] Design depends on Research
   - [ ] Implement depends on Design
   - [ ] Tests depend on Implement

3. **Check Critical Path**
   - [ ] Critical path includes all 4 tasks in order
   - [ ] `metadata.parallelizableTasks` is 0 or very low

### Test Case B: Parallel Opportunities

1. **Decompose Parallel Workflow**
   ```
   Use tool: pde_decompose
   Arguments: { "prompt": "Create user service, create order service, create product service, then integrate all services" }
   ```

2. **Verify Parallelization**
   - [ ] Three create tasks have no dependencies on each other
   - [ ] `metadata.parallelizableTasks` >= 3
   - [ ] Integrate task depends on all create tasks

3. **Check Execution Type**
   - [ ] Stage containing create tasks has `executionType: 'parallel'`

### Test Case C: Mixed Dependencies

1. **Decompose Mixed Workflow**
   ```
   Use tool: pde_decompose
   Arguments: { "prompt": "Analyze requirements, create database schema, create API endpoints, write unit tests, write integration tests, deploy" }
   ```

2. **Verify Dependency Structure**
   - [ ] Analyze has no dependencies
   - [ ] Schema creation depends on Analyze
   - [ ] API creation depends on Schema
   - [ ] Tests depend on their respective targets
   - [ ] Deploy depends on all tests

3. **Check for Cycles**
   - [ ] No circular dependencies detected

## Circular Dependency Detection

### Case D: Intentional Cycle (Edge Case)
```
Module A imports from Module B, Module B imports from Module A, refactor to remove cycle
```

1. **Decompose Potentially Cyclic Request**
   - [ ] PDE should detect the cycle
   - [ ] May flag as ambiguity or issue
   - [ ] Should not crash or hang

## Validation Steps

1. **Validate Each Plan**
   ```
   Use tool: pde_validate_plan
   Arguments: { "planId": "<planId>" }
   ```

2. **Check Validation Results**
   - [ ] `isValid` reflects dependency correctness
   - [ ] Missing dependencies flagged as issues
   - [ ] Circular dependencies flagged if present

## Success Criteria

- ✅ Linear dependencies correctly ordered
- ✅ Parallel opportunities correctly identified
- ✅ Mixed dependency graphs accurately represented
- ✅ Critical path correctly calculated
- ✅ No false circular dependency detection
- ✅ Actual circular dependencies detected (if any)

## Technical Details

### Dependency Graph Structure
```typescript
interface DependencyGraph {
  nodes: DependencyNode[];      // All tasks
  edges: DependencyEdge[];      // Dependencies
  parallelGroups: string[][];   // Tasks that can run together
  criticalPath: string[];       // Longest dependency chain
  hasCycles: boolean;           // Cycle detection result
}
```

### Edge Types
- `must-precede`: Task A must complete before Task B
- `must-follow`: Task A must happen after Task B  
- `blocks`: Task A blocks Task B from parallel execution
- `enables`: Task A enables optional path to Task B

## Performance Considerations

For large dependency graphs:
- Graph construction should be O(n²) worst case
- Cycle detection uses DFS: O(V + E)
- Critical path: O(V + E) with topological sort

The `maxDepth` option (default: 5) limits recursion depth to prevent performance issues with deeply nested dependencies.
