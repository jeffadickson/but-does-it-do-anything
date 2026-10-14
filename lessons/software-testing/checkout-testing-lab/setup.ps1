$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$installDir=Join-Path $HOME '.dotnet'
$existing=Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $existing -or -not ((& dotnet --list-sdks 2>$null) -match '^8\.')) {
  $url='https://dot.net/v1/dotnet-install.ps1'
  $script=Join-Path $env:TEMP 'checkout-dotnet-install.ps1'
  Write-Host "Installing .NET SDK 8 into $installDir from $url"
  Invoke-WebRequest -Uri $url -OutFile $script
  try { & $script -Channel 8.0 -InstallDir $installDir -NoPath } finally { Remove-Item $script -ErrorAction SilentlyContinue }
}
$env:PATH="$installDir;$env:PATH"
dotnet restore tests/Checkout.Tests/Checkout.Tests.csproj
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host 'Setup done. Run ./task.ps1 test. Start Docker manually for integration tests.'
