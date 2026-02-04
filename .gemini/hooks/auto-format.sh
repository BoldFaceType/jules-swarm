#!/usr/bin/env bash
# Auto-format Hook - Runs black formatter after file writes

set -euo pipefail

# Read input from stdin (JSON)
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.args.path // empty')

if [[ -n "$FILE_PATH" && -f "$FILE_PATH" ]]; then
    # Check if file is python
    if [[ "$FILE_PATH" == *.py ]]; then
        black "$FILE_PATH" >/dev/null 2>&1 || true
    fi
fi
