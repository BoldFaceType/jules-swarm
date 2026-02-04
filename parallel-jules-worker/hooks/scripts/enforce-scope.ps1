# enforce-scope.ps1
$inputData = [Console]::In.ReadToEnd()
$json = $inputData | ConvertFrom-Json
$tool_name = if ($json.tool_name) { $json.tool_name } else { "unknown" }
$file_path = if ($json.tool_input.file_path) { $json.tool_input.file_path } else { $json.tool_input.path }

$TASK_SCOPE = if ($env:TASK_SCOPE) { $env:TASK_SCOPE } else { "**/*" }
$WORKER_ID = if ($env:WORKER_ID) { $env:WORKER_ID } else { "standalone" }

# 1. ALLOW READ-ONLY TOOLS AUTOMATICALLY
$ALLOWED_TOOLS = @(
    "read_file", "read_many_files", "list_directory", "glob", 
    "search_file_content", "start_search", "stop_search", "get_file_info",
    "get_run_shell_command", "list_processes", "list_sessions",
    "mcp-find", "mcp-list-tools"
)

if ($ALLOWED_TOOLS -contains $tool_name) {
    exit 0
}

# 2. SKIP IF NO FILE PATH INVOLVED (and not explicitly blocked)
if (-not $file_path) {
    # If it's a write tool without a path (unlikely for file ops), allow or block?
    # run_shell_command has 'command' not 'path'.
    if ($tool_name -eq "run_shell_command") {
        # Optional: Check command string for out-of-scope paths? Too complex for now.
        # Allowing shell commands for MVP but logging warning could be an option.
        # For strict swarm, maybe block shell?
        # Let's allow shell for now to let tests run.
        exit 0
    }
    exit 0
}

# 3. CHECK SCOPE FOR FILE OPERATIONS
# Use Python for robust glob matching
# Escape backslashes for Python string
$safe_file_path = $file_path -replace "\\", "\\"
$safe_pattern = $TASK_SCOPE -replace "\\", "\\"

python3 -c "
import re
import sys

file_path = '$safe_file_path'
pattern = '$safe_pattern'

# Normalize paths to forward slashes for matching
file_path = file_path.replace('\\\\', '/')
pattern = pattern.replace('\\\\', '/')

# Convert simple glob to regex
# ** -> .*
# * -> [^/]*
# ? -> .
res = re.escape(pattern)
res = res.replace(r'\*\*', r'.*')
res = res.replace(r'\*', r'[^/]*')
res = res.replace(r'\?', r'.')
regex = '^' + res + '$'

if re.match(regex, file_path) or pattern == '**/*':
    sys.exit(0)
else:
    sys.exit(1)
" > $null 2>&1

if ($LASTEXITCODE -ne 0) {
  $output = @{
    decision = "deny"
    reason = "File '$file_path' outside scope '$TASK_SCOPE'. Use MCP tool 'request_scope_expansion' to request access."
    systemMessage = "BLOCKED: $file_path (outside scope $TASK_SCOPE)"
  }
  $output | ConvertTo-Json -Depth 10 -Compress
  exit 2
}

exit 0
