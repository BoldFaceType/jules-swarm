---
name: swarm-worker
description: |
  Core identity and coordination protocols for parallel swarm execution.
  Includes MCP callback patterns for Theia orchestrator communication.
---

# Swarm Worker Skill

## Environment Variables
- `WORKER_ID`: Your unique identifier (e.g., "w1")
- `TASK_SCOPE`: Glob pattern for owned files
- `WORKTREE_PATH`: Isolated git worktree path
- `TOTAL_WORKERS`: Number of parallel workers
- `THEIA_MCP_URL`: Orchestrator callback URL (default: http://localhost:3001/mcp)

## MCP Callback Protocol

### Progress Reporting
Report after each significant action:
```
Use tool: report_progress
  status: "analyzing" | "planning" | "implementing" | "testing" | "complete" | "blocked"
  message: "<human readable status>"
  files_modified: ["path/to/file.ts"]
```

### Conflict Signaling
When you detect a conflict:
```
Use tool: signal_conflict
  file: "path/to/conflicted.ts"
  conflict_type: "additive" | "semantic" | "destructive"
  other_worker: "w2"  # if known
  details: "Both workers added validation functions"
```

### Scope Expansion Request
When you need to modify out-of-scope files:
```
Use tool: request_scope_expansion
  files: ["path/to/needed.ts", "path/to/also-needed.ts"]
  reason: "Need to update shared interface used by my modules"
```

## Event Reporting Schema (JSONL fallback)
If MCP unavailable, emit to stdout:
```json
{"worker_id":"w1","event":"progress","status":"implementing","ts":"ISO8601"}
```
