# report-session.ps1
$WORKER_ID = if ($env:WORKER_ID) { $env:WORKER_ID } else { "standalone" }
$timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")

# Try to get git stats, ignore errors if not a git repo
try {
    $files_changed = git diff --stat --cached | Select-Object -Last 1
    if (-not $files_changed) { $files_changed = "0" }
} catch {
    $files_changed = "0"
}

$logEntry = @{
    worker_id = $WORKER_ID
    event = "session_end"
    git_stats = $files_changed
    ts = $timestamp
}

$logJson = $logEntry | ConvertTo-Json -Compress
[Console]::Error.WriteLine($logJson)
exit 0
