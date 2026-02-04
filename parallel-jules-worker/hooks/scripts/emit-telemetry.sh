#!/usr/bin/env bash
input=$(cat)
WORKER_ID="${WORKER_ID:-standalone}"
tool_name=$(echo "$input" | jq -r '.tool_name // "unknown"')
>&2 echo "{\"worker_id\":\"${WORKER_ID}\",\"event\":\"tool\",\"tool\":\"${tool_name}\",\"ts\":\"$(date -Iseconds)\"}"
exit 0
