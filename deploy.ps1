# Safe deploy — Rosemary only (never bare firebase deploy)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Proxy = if ($env:HAWK_PROXY) { $env:HAWK_PROXY } else { "http://127.0.0.1:10808" }
$env:HTTP_PROXY = $Proxy
$env:HTTPS_PROXY = $Proxy
$env:http_proxy = $Proxy
$env:https_proxy = $Proxy
$env:NODE_USE_ENV_PROXY = "1"
$env:NO_PROXY = "localhost,127.0.0.1,::1,metadata.google.internal,metadata.google.internal."
$env:no_proxy = $env:NO_PROXY
$env:METADATA_SERVER_DETECTION = "none"

Write-Host "Using proxy $Proxy"
Write-Host "== Verify target binding ==" -ForegroundColor Cyan
Get-Content .firebaserc
$firebaseJson = Get-Content firebase.json -Raw
if ($firebaseJson -notmatch '"target"\s*:\s*"rosemary"') {
  throw "firebase.json missing hosting.target rosemary"
}

Write-Host "== Deploy hosting:rosemary only ==" -ForegroundColor Cyan
firebase deploy --only hosting:rosemary --project daisy-c2db8
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "== Spot-check ==" -ForegroundColor Yellow
Write-Host "https://rosemary-care-notebook.web.app"
Write-Host "https://focusspace-3d.web.app"
Write-Host "https://luna-dining-3d.web.app"
