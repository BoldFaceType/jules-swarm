# inject-context.ps1
$WORKER_ID = if ($env:WORKER_ID) { $env:WORKER_ID } else { "standalone" }
$TASK_SCOPE = if ($env:TASK_SCOPE) { $env:TASK_SCOPE } else { "**/*" }
$WORKTREE_PATH = if ($env:WORKTREE_PATH) { $env:WORKTREE_PATH } else { (Get-Location).Path }
$TOTAL_WORKERS = if ($env:TOTAL_WORKERS) { $env:TOTAL_WORKERS } else { "1" }
$THEIA_MCP_URL = if ($env:THEIA_MCP_URL) { $env:THEIA_MCP_URL } else { "http://localhost:3001/mcp" }

$output = @{
    hookSpecificOutput = @{
        hookEventName = "BeforeAgent"
        additionalContext = "## Swarm Worker Identity`n- ID: $WORKER_ID`n- Scope: `$TASK_SCOPE`n- Worktree: `$WORKTREE_PATH`n- Orchestrator: $THEIA_MCP_URL"
    }
    systemMessage = "🤖 Worker $WORKER_ID/$TOTAL_WORKERS | Scope: $TASK_SCOPE | MCP: $THEIA_MCP_URL"
}

$output | ConvertTo-Json -Depth 10 -Compress
