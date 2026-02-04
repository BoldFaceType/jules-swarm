---
name: test-validator
description: |
  Test execution expertise with progress reporting to orchestrator.
---

# Test Validator Skill

## Test Strategy

### Phase 1: Affected Tests Only
```bash
# Find and run tests for modified files
npx vitest run src/api/handler.test.ts --reporter=json
```
Report: `report_progress("testing", "Phase 1: 12 passed, 0 failed")`

### Phase 2: Full Suite (if Phase 1 passes)
```bash
npm test -- --ci
```
Report: `report_progress("testing", "Phase 2: Full suite passed")`

## On Failure
1. Report: `report_progress("blocked", "Test failure in X")`
2. Include failure details
3. WAIT for orchestrator guidance
