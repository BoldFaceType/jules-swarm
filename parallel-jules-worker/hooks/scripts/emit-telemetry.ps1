# emit-telemetry.ps1
$inputData = [Console]::In.ReadToEnd()
$json = $inputData | ConvertFrom-Json
$tool_name = if ($json.tool_name) { $json.tool_name } else { "unknown" }
$WORKER_ID = if ($env:WORKER_ID) { $env:WORKER_ID } else { "standalone" }
$timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")

$logEntry = @{
    worker_id = $WORKER_ID
    event = "tool"
    tool = $tool_name
    ts = $timestamp
}

$logJson = $logEntry | ConvertTo-Json -Compress
[Console]::Error.WriteLine($logJson)
exit 0
