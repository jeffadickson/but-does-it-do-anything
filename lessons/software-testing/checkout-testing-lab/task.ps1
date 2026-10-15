param([ValidateSet('setup','doctor','build','test','integration','preview','clean')][string]$Task='doctor')
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
if ($Task -eq 'setup') { & "$PSScriptRoot/setup.ps1"; exit $LASTEXITCODE }
if ($Task -eq 'preview') { if (Get-Command py -ErrorAction SilentlyContinue) { py -3 -m http.server 8000 -d app --bind 127.0.0.1 } elseif (Get-Command python -ErrorAction SilentlyContinue) { python -m http.server 8000 -d app --bind 127.0.0.1 } else { throw 'Install Python 3 to preview or open app/index.html directly.' }; exit $LASTEXITCODE }
$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnet) { $candidate=Join-Path $HOME '.dotnet/dotnet.exe'; if(Test-Path $candidate){$env:PATH=(Split-Path $candidate)+';'+$env:PATH} else {throw 'Missing .NET SDK; run ./setup.ps1'} }
$project='tests/Checkout.Tests/Checkout.Tests.csproj'
switch ($Task) {
 'doctor' { dotnet --version; if (Get-Command docker -ErrorAction SilentlyContinue) {docker info *> $null; if ($LASTEXITCODE -eq 0) {'Docker available'} else {'Docker engine not running'}} else {'Docker not installed (optional for unit tests)'} }
 'build' {dotnet build $project}
 'test' {dotnet test $project --filter 'FullyQualifiedName!~CombinedCheckoutIntegrationTests'}
 'integration' {dotnet test $project --filter 'FullyQualifiedName~CombinedCheckoutIntegrationTests'}
 'clean' {dotnet clean $project}
}
exit $LASTEXITCODE
