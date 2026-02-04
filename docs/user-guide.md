# Jules Swarm User Guide

## Quick Start

### 1. Install Theia AI IDE
Download from https://theia-ide.org/download/ (v1.67+)

### 2. Install Gemini CLI Extension
```bash
gemini extensions install https://github.com/yourusername/parallel-jules-worker
```

### 3. Configure API Keys
- Gemini API: Set in Theia settings or `GOOGLE_API_KEY` env var
- Ensure Theia MCP server enabled (default: http://localhost:3001/mcp)

### 4. Start Swarming!
```
/swarm Add comprehensive error handling to all service methods
```

## Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `/swarm <task>` | Start parallel execution | `/swarm Add logging` |
| `/swarm:status` | Check all workers | `/swarm:status` |
| `/swarm:abort` | Stop all workers | `/swarm:abort` |
| `/swarm:recover` | Resume interrupted session | `/swarm:recover` |

## Understanding the Workflow

### 1. Task Decomposition
The orchestrator analyzes your task and proposes a plan:
- Identifies independent modules/files
- Assigns non-overlapping scopes to workers
- Presents plan for your approval

### 2. Parallel Execution
After approval:
- Workers spawn in Terminal Manager (tree view)
- Each operates in isolated git worktree
- Progress updates appear in chat

### 3. Conflict Resolution
If workers touch overlapping code:
- Orchestrator detects via MCP callbacks
- Pauses affected workers
- Delegates to ConflictResolver agent
- Presents resolution for approval

### 4. Merge & Commit
When all workers complete:
- Changes appear in Changeset UI
- Review diffs, apply/revert individual changes
- Approve final commit

## Best Practices

### Good Swarm Tasks ✅
- "Add validation to all form handlers"
- "Convert callbacks to async/await in services/"
- "Add unit tests for utils/ functions"

### Poor Swarm Tasks ❌
- "Refactor the entire codebase" (too broad)
- "Fix the bug" (too vague)
- "Update package.json" (single file, no parallelism benefit)

## Troubleshooting

### Workers Not Spawning
1. Check Gemini CLI installed: `gemini --version`
2. Check extension linked: `gemini -l`
3. Check Terminal Manager enabled: `terminal.grouping.mode: "tree"`

### MCP Connection Failed
1. Verify Theia MCP server running: `curl http://localhost:3001/mcp`
2. Check firewall not blocking localhost
3. Workers fall back to JSONL if MCP unavailable

### Conflicts Not Detected
- Ensure workers use `git status` before writes
- Check TASK_SCOPE environment variable set correctly
