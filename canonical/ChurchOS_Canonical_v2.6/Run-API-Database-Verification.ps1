$ErrorActionPreference = 'Stop'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop must be installed and running.' }
$taskName = 'cosapi-' + [guid]::NewGuid().ToString('N').Substring(0, 10)
$composeFile = Join-Path $PSScriptRoot 'tools/api-db/compose.yaml'
$taskExit = 1
try {
    & docker compose -p $taskName -f $composeFile up --build --abort-on-container-exit --exit-code-from verify
    $taskExit = $LASTEXITCODE
}
finally {
    & docker compose -p $taskName -f $composeFile down --volumes --remove-orphans
    if ($LASTEXITCODE -ne 0) { $taskExit = 1 }
}
if ($taskExit -ne 0) { throw 'API/DB verification incomplete. See ChurchOS_API_DB_Evidence_v2.6 beside this package.' }
Write-Host 'API/DB verification completed. See ChurchOS_API_DB_Evidence_v2.6 beside this package.'
