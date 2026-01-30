# Scenario 01: Simple Prompt Decomposition

## Objective
Test that a simple, single-intent prompt is correctly decomposed into a structured execution plan.

## Scenario Description
A developer wants to create a new feature. The LLM agent should use PDE to decompose this request into actionable steps aligned with the Medicine Wheel framework.

## Input Prompt
```
Create a user registration form with email validation
```

## Expected Behavior

### 1. Intent Extraction (Layer 1)
The PDE should extract:
- **Explicit Intent 1**: CREATION intent for "registration form"
- **Implicit Intent**: VALIDATION requirement for "email validation"

### 2. Direction Assignment (Layer 3)
- CREATION → SOUTH (Nahat'á - Planning & Growth)
- VALIDATION aspects → WEST (Iina - Living & Action)

### 3. Workflow Structure (Layer 4)
Expected stages:
```
Stage: SOUTH - Planning & Growth
  - [ ] Create registration form component
  - [ ] Design form fields and layout

Stage: WEST - Living & Action
  - [ ] Implement email validation logic
  - [ ] Test validation edge cases
```

## Test Steps for LLM Agent

1. **Configure MCP**
   ```json
   {
     "mcpServers": {
       "pde": {
         "command": "node",
         "args": ["dist/index.js"]
       }
     }
   }
   ```

2. **Call pde_decompose tool**
   ```
   Use tool: pde_decompose
   Arguments: { "prompt": "Create a user registration form with email validation" }
   ```

3. **Verify Response**
   - [ ] Response contains `planId`
   - [ ] Response contains `workflowId`
   - [ ] Response contains at least one stage
   - [ ] SOUTH stage exists with creation tasks
   - [ ] `overallIntention` mentions "create" and "registration"

4. **Validate the plan**
   ```
   Use tool: pde_validate_plan
   Arguments: { "planId": "<planId from step 2>" }
   ```

5. **Check Validation**
   - [ ] `isValid` is true
   - [ ] `coherenceScore` >= 80
   - [ ] `completenessScore` >= 80

## Success Criteria

- ✅ Single prompt decomposed into multi-stage plan
- ✅ Intent correctly classified as CREATION
- ✅ Medicine Wheel direction (SOUTH) assigned
- ✅ Plan validation passes
- ✅ No errors in execution

## Notes

This is the simplest scenario to verify basic PDE functionality. If this fails, check:
1. MCP server is running and connected
2. `pde_decompose` tool is registered
3. TypeScript compilation succeeded
