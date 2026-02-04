#!/usr/bin/env bash
# Security Guard Hook - Replaces the incorrect JavaScript hooks.js
# Prevents sandbox escapes and blocks dangerous commands

set -euo pipefail

# Read input from stdin (JSON)
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.args.path // empty')

# Sandbox enforcement - prevent directory traversal
PROJECT_DIR="${GEMINI_PROJECT_DIR:-$(pwd)}"
if [[ -n "$FILE_PATH" ]]; then
    RESOLVED=$(realpath -m "$FILE_PATH" 2>/dev/null || echo "$FILE_PATH")
    if [[ ! "$RESOLVED" == "$PROJECT_DIR"* ]]; then
        echo '{"decision": "block", "reason": "Directory traversal blocked"}'
        exit 0
    fi
fi

# Block dangerous shell commands
if [[ "$TOOL_NAME" == "run_shell_command" ]]; then
    COMMAND=$(echo "$INPUT" | jq -r '.args.command // empty')
    FORBIDDEN=(
        "rm -rf /"
        "git push"
        "git reset --hard"
        "shutdown"
        "mkfs"
        "dd if="
        "> /dev/"
    )
    for pattern in "${FORBIDDEN[@]}"; do
        if [[ "$COMMAND" == *"$pattern"* ]]; then
            echo '{"decision": "block", "reason": "Command blacklisted: "'"$pattern"'"}'
            exit 0
        fi
    done
fi

# Log for audit trail (structured JSON to stderr)
>&2 echo "{"timestamp": "$(date -Iseconds)", "level": "AUDIT", "tool": "$TOOL_NAME", "decision": "allow"}"

# Allow by default
echo '{"decision": "allow"}'
