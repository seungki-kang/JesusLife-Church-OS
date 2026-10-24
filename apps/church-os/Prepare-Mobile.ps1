$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  throw 'Flutter 명령을 찾지 못했습니다. Flutter가 설정된 VS Code 터미널에서 실행하세요.'
}
$seed = Join-Path ([System.IO.Path]::GetTempPath()) ('churchos_seed_' + [guid]::NewGuid().ToString('N'))
try {
  if (-not (Test-Path (Join-Path $PSScriptRoot 'android')) -or -not (Test-Path (Join-Path $PSScriptRoot 'ios'))) {
    flutter create --platforms=android,ios --project-name=churchos_app --org=com.zoenx --no-pub $seed
    if ($LASTEXITCODE -ne 0) { throw '모바일 플랫폼 생성 실패' }
    foreach ($platform in @('android', 'ios')) {
      $destination = Join-Path $PSScriptRoot $platform
      if (-not (Test-Path $destination)) {
        Copy-Item -LiteralPath (Join-Path $seed $platform) -Destination $destination -Recurse
      }
    }
    if (-not (Test-Path (Join-Path $PSScriptRoot '.metadata'))) {
      Copy-Item -LiteralPath (Join-Path $seed '.metadata') -Destination (Join-Path $PSScriptRoot '.metadata')
    }
  }
  flutter pub get
  if ($LASTEXITCODE -ne 0) { throw '패키지 설치 실패' }
  flutter analyze
  if ($LASTEXITCODE -ne 0) { throw '분석 실패: 출력을 보내주세요.' }
  flutter test
  if ($LASTEXITCODE -ne 0) { throw '테스트 실패: 출력을 보내주세요.' }
  Write-Host '앱 준비·분석·테스트 완료. flutter devices로 실행할 모바일 기기를 확인하세요.'
  Write-Host 'iOS 빌드·서명·실행은 macOS와 Xcode 환경에서 별도로 검증해야 합니다.'
}
finally {
  if (Test-Path $seed) { Remove-Item -LiteralPath $seed -Recurse -Force }
}
