param([ValidateSet('setup','doctor','build','test','preview','clean')][string]$Task='setup')
$ErrorActionPreference='Stop'
if ($env:OS -ne 'Windows_NT') {throw 'This reader uses Windows Firewall and requires Windows.'}
$lesson=Join-Path $PSScriptRoot '../lessons/mathematics/algebra-adventure'
& (Join-Path $lesson 'setup.ps1') setup
if ($LASTEXITCODE -ne 0) {exit $LASTEXITCODE}
$version=(Get-Content (Join-Path $lesson 'tools/node-version.txt') -Raw).Trim()
$arch=if ($env:PROCESSOR_ARCHITEW6432) {$env:PROCESSOR_ARCHITEW6432} else {$env:PROCESSOR_ARCHITECTURE}
$arch=if ($arch -eq 'ARM64') {'arm64'} else {'x64'}
$node=Join-Path $lesson ".tools/node-v$version-win-$arch/node.exe"
$existing=Get-Command node -ErrorAction SilentlyContinue
if ($existing -and (& $existing.Source --version) -eq "v$version") {$node=$existing.Source}
$oldPath=$env:PATH
$env:PATH=(Split-Path $node)+[IO.Path]::PathSeparator+$oldPath
function Invoke-Checked([string]$Command,[string[]]$Arguments) {
 & $Command @Arguments
 if ($LASTEXITCODE -ne 0) {throw "$Command failed ($LASTEXITCODE). Check network access, prerequisites and the preceding error; rerun ./viewer/setup.ps1 after correction."}
}
Push-Location $PSScriptRoot
try {
 switch ($Task) {
  'setup' {
   Invoke-Checked 'npm.cmd' @('ci')
   Invoke-Checked 'npm.cmd' @('run','setup:electron')
   Write-Host 'Reader dependencies installed. Firewall rules require separate explicit administrator setup; see viewer/README.md.'
  }
  'doctor' {
   Invoke-Checked $node @((Join-Path $lesson 'task.cjs'),'doctor')
   Invoke-Checked 'npm.cmd' @('ls','--depth=0')
   if (!(Test-Path 'node_modules/electron/dist/electron.exe')) {throw 'Electron is missing. Run ./viewer/setup.ps1.'}
   Write-Host 'Dependencies available. This check does not install or certify firewall rules.'
  }
  'clean' {
   foreach ($folder in @('dist','.stage','books')) {if (Test-Path $folder) {Remove-Item -Recurse -Force $folder}}
  }
  default {
   Invoke-Checked $node @((Join-Path $lesson 'task.cjs'),'build')
   switch ($Task) {
    'build' {Invoke-Checked 'npm.cmd' @('run','package:win')}
    'test' {Invoke-Checked 'npm.cmd' @('test')}
    'preview' {Invoke-Checked 'npm.cmd' @('start')}
   }
  }
 }
} finally {Pop-Location; $env:PATH=$oldPath}
