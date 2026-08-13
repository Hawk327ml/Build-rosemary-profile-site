# Route Firebase/Node traffic through v2rayN mixed port (system proxy alone is not enough for Node).
$ErrorActionPreference = "Stop"

$Proxy = if ($env:HAWK_PROXY) { $env:HAWK_PROXY } else { "http://127.0.0.1:10808" }

$env:HTTP_PROXY = $Proxy
$env:HTTPS_PROXY = $Proxy
$env:http_proxy = $Proxy
$env:https_proxy = $Proxy
$env:NODE_USE_ENV_PROXY = "1"
$env:NO_PROXY = "localhost,127.0.0.1,::1,metadata.google.internal,metadata.google.internal."
$env:no_proxy = $env:NO_PROXY
$env:METADATA_SERVER_DETECTION = "none"

if ($args.Count -eq 0) {
  Write-Host "Usage: .\scripts\with-proxy.ps1 <command> [args...]"
  Write-Host "Example: .\scripts\with-proxy.ps1 firebase deploy --only hosting:rosemary --project daisy-c2db8"
  exit 1
}

Write-Host "Using proxy $Proxy"
# Use --% stop-parsing when callers pass firebase flags like --only (PowerShell would otherwise bind them).
if ($args.Count -ge 1 -and $args[0] -eq '--%') {
  & $args[1] @($args | Select-Object -Skip 2)
} else {
  & $args[0] @($args | Select-Object -Skip 1)
}
exit $LASTEXITCODE
