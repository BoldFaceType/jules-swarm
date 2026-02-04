#!/usr/bin/env bash
WORKER_ID="${WORKER_ID:-standalone}"
files_changed=$(git diff --stat --cached 2>/dev/null | tail -1 || echo "0")
>&2 echo "{\"worker_id\":\"${WORKER_ID}\",\"event\":\"session_end\",\"git_stats\":\"${files_changed}\",\"ts\":\"$(date -Iseconds)\"}"
exit 0
