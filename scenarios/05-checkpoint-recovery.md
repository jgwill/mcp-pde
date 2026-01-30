# Scenario 05: Checkpoint and Recovery

## Objective
Test that the PDE creates proper checkpoints during workflow execution and enables recovery from failures.

## Scenario Description
In real-world usage, workflows may fail partway through. The PDE must:
- Create checkpoints after each stage
- Store context snapshots for recovery
- Enable resumption from last successful checkpoint
- Provide clear recovery instructions

## Test Workflow
```
Create database models, generate API routes, write tests, deploy to staging
```

## Expected Checkpoint Structure

After each stage completes:
```typescript
{
  checkpointId: "uuid",
  workflowId: "workflow-uuid",
  stageId: "stage-south",
  taskId: "task-3",
  timestamp: "2026-01-30T10:00:00Z",
  contextSnapshot: {
    completedTasks: ["task-1", "task-2", "task-3"],
    outputs: {...},
    environment: {...}
  },
  resumeInstructions: "Resume from stage stage-west, task task-4"
}
```

## Test Steps for LLM Agent

### Step 1: Create Initial Plan

1. **Decompose Workflow**
   ```
   Use tool: pde_decompose
   Arguments: { 
     "prompt": "Create database models, generate API routes, write tests, deploy to staging"
   }
   ```

2. **Note Plan Structure**
   - [ ] Record `planId` for later use
   - [ ] Record `workflowId` for checkpoint retrieval
   - [ ] Verify `checkpointAfter: true` on stages

### Step 2: Simulate Stage Completion

For this test, we verify the checkpoint structure is correct. In a real execution:

1. **Execute First Stage** (simulated)
   - Stage SOUTH completes
   - Checkpoint should be created

2. **Get Checkpoint**
   ```
   Use tool: pde_get_checkpoint
   Arguments: { 
     "workflowId": "<workflowId from step 1>"
   }
   ```

3. **Verify Checkpoint** (if exists)
   - [ ] Contains `checkpointId`
   - [ ] Contains `workflowId` matching plan
   - [ ] Contains `contextSnapshot`
   - [ ] Contains `resumeInstructions`

### Step 3: Verify Recovery Readiness

1. **Check Plan for Recovery Data**
   ```
   Use tool: pde_get_plan
   Arguments: { "planId": "<planId>" }
   ```

2. **Examine Task Recovery Strategies**
   For each task in `plan.tasks`:
   - [ ] Has `recoveryStrategy` defined
   - [ ] `onFailure` is one of: 'retry', 'skip', 'alternative', 'abort'
   - [ ] `retryCount` is reasonable (1-5)

3. **Examine Checkpoint Data**
   For each task:
   - [ ] Has `checkpointData` defined
   - [ ] `saves` lists expected outputs
   - [ ] `restoresFrom` references valid checkpoint (if applicable)

### Step 4: List and Verify Workflows

1. **List All Workflows**
   ```
   Use tool: pde_list_workflows
   Arguments: { "status": "all", "limit": 10 }
   ```

2. **Verify Workflow Appears**
   - [ ] Workflow from Step 1 is in list
   - [ ] Shows correct `intention`
   - [ ] Shows correct `taskCount`

## Expected Recovery Flow

When a failure occurs at Stage WEST (testing):

```
Workflow Execution:
  ✓ Stage EAST  - Vision Inquiry (completed)
  ✓ Stage SOUTH - Implementation (completed)
    📍 Checkpoint created: cp-123
  ✗ Stage WEST  - Validation (FAILED at task-5)
    └─ Error: Test assertion failed
    └─ Recovery: retry (attempt 1/3)
    └─ Checkpoint available: cp-123
  
Resume Options:
  1. Retry from task-5 (same approach)
  2. Retry from task-5 (alternative approach)
  3. Skip task-5 and continue
  4. Rollback to checkpoint cp-123
```

## Success Criteria

- ✅ Each stage has `checkpointAfter: true`
- ✅ Tasks have valid `recoveryStrategy` definitions
- ✅ Tasks have valid `checkpointData` definitions
- ✅ Checkpoint retrieval works by workflowId
- ✅ Resume instructions are clear and actionable
- ✅ Workflow appears in list with correct metadata

## Recovery Strategy Types

| Strategy | Use Case |
|----------|----------|
| `retry` | Transient failures (network, timeout) |
| `skip` | Non-critical tasks that can be skipped |
| `alternative` | When different approach might succeed |
| `abort` | Critical failures requiring human intervention |

## Checkpoint Best Practices

1. **Checkpoint Granularity**: After each stage, not each task
2. **Context Preservation**: Save all outputs and relevant state
3. **Clear Instructions**: Tell user exactly how to resume
4. **Minimal Overhead**: Don't checkpoint trivially small operations

## Error Handling Verification

1. **Missing Workflow**
   ```
   Use tool: pde_get_checkpoint
   Arguments: { "workflowId": "non-existent-id" }
   ```
   - [ ] Returns graceful "not found" message
   - [ ] Does not crash or throw error

2. **Invalid Plan ID**
   ```
   Use tool: pde_validate_plan
   Arguments: { "planId": "invalid-id" }
   ```
   - [ ] Returns `isValid: false`
   - [ ] Includes helpful error message
