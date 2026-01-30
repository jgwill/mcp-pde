# Scenario 03: Ceremonial Alignment Verification

## Objective
Test that the Medicine Wheel ceremonial framework is correctly applied to categorize tasks by their epistemological nature.

## Scenario Description
This scenario tests the core Indigenous knowledge system integration by verifying that different types of work are correctly aligned with the Four Directions.

## Input Prompts (Test Each Separately)

### Prompt A: EAST Focus (Analysis/Vision)
```
Analyze the current system architecture and explore potential improvements
```

### Prompt B: SOUTH Focus (Creation/Building)
```
Build a new authentication module with OAuth2 support
```

### Prompt C: WEST Focus (Validation/Integration)
```
Test the payment gateway integration and verify all edge cases
```

### Prompt D: NORTH Focus (Completion/Wisdom)
```
Deploy the application to production and document the release
```

## Expected Behavior

### Prompt A: EAST Alignment
| Aspect | Expected |
|--------|----------|
| Primary Direction | EAST |
| Direction Name | Nitsáhákees |
| Theme | Thinking & Beginnings |
| Ceremony Type | vision_inquiry |
| Color | #FFD700 (Gold) |

Tasks should focus on:
- Exploration and research
- Question formation
- Vision setting

### Prompt B: SOUTH Alignment
| Aspect | Expected |
|--------|----------|
| Primary Direction | SOUTH |
| Direction Name | Nahat'á |
| Theme | Planning & Growth |
| Ceremony Type | wave_counting |
| Color | #32CD32 (Green) |

Tasks should focus on:
- Implementation and building
- Structural design
- Methodology application

### Prompt C: WEST Alignment
| Aspect | Expected |
|--------|----------|
| Primary Direction | WEST |
| Direction Name | Iina |
| Theme | Living & Action |
| Ceremony Type | talking_circles |
| Color | #4682B4 (Steel Blue) |

Tasks should focus on:
- Testing and validation
- Integration verification
- Reflection on quality

### Prompt D: NORTH Alignment
| Aspect | Expected |
|--------|----------|
| Primary Direction | NORTH |
| Direction Name | Siihasin |
| Theme | Assurance & Reflection |
| Ceremony Type | elder_council |
| Color | #FFFFFF (White) |

Tasks should focus on:
- Deployment and finalization
- Documentation (wisdom sharing)
- Completion ceremonies

## Test Steps for LLM Agent

1. **Get Medicine Wheel Reference**
   ```
   Read resource: pde://ceremonies/medicine-wheel
   ```
   - [ ] Verify all four directions are defined
   - [ ] Each has Indigenous name, theme, ceremony type, color

2. **Test EAST Alignment (Prompt A)**
   ```
   Use tool: pde_decompose
   Arguments: { "prompt": "Analyze the current system architecture and explore potential improvements" }
   ```
   - [ ] Primary stage direction is EAST
   - [ ] `directionDescription` contains "Thinking" or "Vision"
   - [ ] Tasks include analysis-type verbs

3. **Test SOUTH Alignment (Prompt B)**
   ```
   Use tool: pde_decompose
   Arguments: { "prompt": "Build a new authentication module with OAuth2 support" }
   ```
   - [ ] Primary stage direction is SOUTH
   - [ ] `directionDescription` contains "Planning" or "Growth"
   - [ ] Tasks include creation-type verbs

4. **Test WEST Alignment (Prompt C)**
   ```
   Use tool: pde_decompose
   Arguments: { "prompt": "Test the payment gateway integration and verify all edge cases" }
   ```
   - [ ] Primary stage direction is WEST
   - [ ] `directionDescription` contains "Action" or "Integration"
   - [ ] Tasks include validation-type verbs

5. **Test NORTH Alignment (Prompt D)**
   ```
   Use tool: pde_decompose
   Arguments: { "prompt": "Deploy the application to production and document the release" }
   ```
   - [ ] Primary stage direction is NORTH
   - [ ] `directionDescription` contains "Reflection" or "Assurance"
   - [ ] Tasks include completion-type verbs

## Success Criteria

- ✅ EAST direction correctly assigned to ANALYSIS intents
- ✅ SOUTH direction correctly assigned to CREATION intents
- ✅ WEST direction correctly assigned to VALIDATION/INTEGRATION intents
- ✅ NORTH direction correctly assigned to COMMUNICATION/DEPLOYMENT intents
- ✅ Each direction has correct Indigenous metadata
- ✅ Ceremony types match directions

## Cultural Context

The Medicine Wheel framework honors Indigenous epistemology:

1. **EAST (Nitsáhákees)** - The place of new beginnings, where light first appears. Appropriate for exploration and vision work.

2. **SOUTH (Nahat'á)** - The place of growth and warmth. Appropriate for building and implementation.

3. **WEST (Iina)** - The place of integration and introspection. Appropriate for testing and reflection.

4. **NORTH (Siihasin)** - The place of wisdom and completion. Appropriate for finalization and knowledge sharing.

This ceremonial alignment brings intentionality and structure to AI-assisted development, honoring the natural cycles of creation.
