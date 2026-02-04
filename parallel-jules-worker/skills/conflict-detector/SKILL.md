---
name: conflict-detector
description: |
  Expertise in detecting file conflicts during parallel work.
  Signals conflicts to Theia orchestrator via MCP.
---

# Conflict Detector Skill

## Detection Methods

### Pre-Write Check
Before every write_file or replace:
```bash
git status --porcelain "$FILE"
# If non-empty AND file not in your scope → CONFLICT
```

### During-Write Check
After writing, verify no race condition:
```bash
git diff HEAD -- "$FILE"
# If unexpected changes → signal_conflict
```

## Conflict Response
On detecting any conflict:
1. STOP current operation
2. Call MCP: `signal_conflict(file, type, details)`
3. WAIT for orchestrator response
4. Do NOT attempt auto-resolution

## Conflict Types

| Type | Detection | Auto-Resolvable |
|------|-----------|-----------------|
| Additive | Both workers added to same file | Maybe |
| Semantic | Same function modified differently | No |
| Destructive | One deleted what other modified | No |
