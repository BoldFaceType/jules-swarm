#!/usr/bin/env bash
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // ""')
TASK_SCOPE="${TASK_SCOPE:-**/*}"
WORKER_ID="${WORKER_ID:-standalone}"

# Skip in standalone mode or if everything is allowed
[[ "$WORKER_ID" == "standalone" || "$TASK_SCOPE" == "**/*" ]] && exit 0

# Use Python for robust glob matching
python3 -c "
import fnmatch
import os
import sys

file_path = '$file_path'
pattern = '$TASK_SCOPE'

# fnmatch doesn't support recursive ** natively in a simple way for paths
# but for our worker scope it's usually enough or we can use a small regex
import re

def glob_to_re(pat):
    # Very simple glob to regex converter for path matching
    res = re.escape(pat)
    res = res.replace(r'\*\*', r'.*')
    res = res.replace(r'\*', r'[^/]*')
    res = res.replace(r'\?', r'.')
    return '^' + res + '$'

if re.match(glob_to_re(pattern), file_path):
    sys.exit(0)
else:
    sys.exit(1)
" > /dev/null 2>&1

if [ $? -ne 0 ]; then
  cat <<EOF
{
  "decision": "deny",
  "reason": "File '${file_path}' outside scope '${TASK_SCOPE}'. Use MCP tool 'request_scope_expansion' to request access.",
  "systemMessage": "⛔ Blocked: ${file_path} (use request_scope_expansion via MCP)"
}
EOF
  exit 2
fi

exit 0