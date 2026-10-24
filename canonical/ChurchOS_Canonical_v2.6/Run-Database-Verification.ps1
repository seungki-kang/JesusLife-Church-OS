$ErrorActionPreference = 'Stop'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker Desktop is required. Start Docker Desktop before running this script.'
}
$taskName = 'cosverify-' + [guid]::NewGuid().ToString('N').Substring(0, 10)
$composeFile = Join-Path $PSScriptRoot 'tools/postgres/compose.yaml'
$taskExit = 1
try {
    & docker compose -p $taskName -f $composeFile up --build --abort-on-container-exit --exit-code-from verify
    $taskExit = $LASTEXITCODE
}
finally {
    & docker compose -p $taskName -f $composeFile down --volumes --remove-orphans
    if ($LASTEXITCODE -ne 0) { $taskExit = 1 }
}
if ($taskExit -ne 0) { throw 'Verification incomplete or failed. See ChurchOS_Runtime_Evidence beside the package folder.' }
Write-Host 'Verification completed. See ChurchOS_Runtime_Evidence beside the package folder.'
