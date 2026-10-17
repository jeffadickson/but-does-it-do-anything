param([ValidateSet('setup','doctor','build','test-unit','test','preview','clean')][string]$Task='doctor')
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$env:DOTNET_ROOT=Join-Path $PSScriptRoot '.dotnet'
$env:PATH="$env:DOTNET_ROOT;$env:PATH"
$project='tests/InstrumentLab.Tests/InstrumentLab.Tests.csproj'
switch($Task) {
 setup {
  if (-not (Test-Path "$env:DOTNET_ROOT/dotnet.exe")) {
   $installer=Join-Path $env:TEMP 'instrument-dotnet-install.ps1'
   Invoke-WebRequest 'https://dot.net/v1/dotnet-install.ps1' -OutFile $installer
   & $installer -Version '10.0.100' -InstallDir $env:DOTNET_ROOT
  }
  dotnet restore $project
 }
 doctor {dotnet --info}
 build {dotnet build $project --configuration Release}
 test-unit {dotnet test $project --filter 'FullyQualifiedName~WorkflowTests'}
 test {dotnet test $project}
 preview {Push-Location app; try {py -3 -m http.server 8001 --bind 127.0.0.1} finally {Pop-Location}}
 clean {Get-ChildItem src,tests -Directory -Recurse | Where-Object {$_.Name -in @('bin','obj')} | Remove-Item -Recurse -Force}
}
