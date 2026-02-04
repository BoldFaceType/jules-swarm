#!/usr/bin/env bash
WORKER_ID="${WORKER_ID:-standalone}"
TASK_SCOPE="${TASK_SCOPE:-**/*}"
WORKTREE_PATH="${WORKTREE_PATH:-$(pwd)}"
TOTAL_WORKERS="${TOTAL_WORKERS:-1}"
THEIA_MCP_URL="${THEIA_MCP_URL:-http://localhost:3001/mcp}"

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "BeforeAgent",
    "additionalContext": "## Swarm Worker Identity\n- ID: ${WORKER_ID}\n- Scope: \\`${TASK_SCOPE}\\\n- Worktree: \\`${WORKTREE_PATH}\\\n- Orchestrator: ${THEIA_MCP_URL}"
  },
  "systemMessage": "🤖 Worker ${WORKER_ID}/${TOTAL_WORKERS} | Scope: ${TASK_SCOPE} | MCP: ${THEIA_MCP_URL}"
}
EOF
