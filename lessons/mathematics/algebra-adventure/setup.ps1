param([ValidateSet('setup','doctor','build','test','preview','clean')][string]$Task='setup')
$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$version=(Get-Content (Join-Path $root 'tools/node-version.txt') -Raw).Trim()
if ($env:OS -ne 'Windows_NT') { throw 'Use setup.sh on macOS/Linux.' }
$arch=if ($env:PROCESSOR_ARCHITEW6432) {$env:PROCESSOR_ARCHITEW6432} else {$env:PROCESSOR_ARCHITECTURE}
switch ($arch) { 'AMD64' {$arch='x64'} 'ARM64' {$arch='arm64'} default {throw 'Supported Windows architectures: x64 and arm64.'} }
$folder="node-v$version-win-$arch"
$local=Join-Path $root ".tools/$folder"
$node=Join-Path $local 'node.exe'
$existing=Get-Command node -ErrorAction SilentlyContinue
if ($existing -and (& $existing.Source --version) -eq "v$version") {$node=$existing.Source}
if (!(Test-Path $node)) {
 New-Item -ItemType Directory -Force (Join-Path $root '.tools') | Out-Null
 $temp=Join-Path $root ('.tools/download.'+[guid]::NewGuid().ToString('N'))
 New-Item -ItemType Directory $temp | Out-Null
 try {
  $archive="$folder.zip"
  $line=Get-Content (Join-Path $root 'tools/node-SHASUMS256.txt') | Where-Object {($_ -split '\s+')[1] -eq $archive}
  if (!$line) {throw "No pinned checksum for $archive"}
  $expected=($line -split '\s+')[0]
  [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
  $zip=Join-Path $temp $archive
  Invoke-WebRequest -UseBasicParsing "https://nodejs.org/dist/v$version/$archive" -OutFile $zip
  if ((Get-FileHash $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) {throw 'Checksum mismatch; refusing to install.'}
  Expand-Archive -Path $zip -DestinationPath $temp
  Move-Item (Join-Path $temp $folder) $local
 } catch {throw "Setup failed: $_. Allow HTTPS to nodejs.org and rerun, or install Node $version from the official distribution."}
 finally {Remove-Item -Recurse -Force $temp}
}
& $node (Join-Path $root 'task.cjs') $Task
exit $LASTEXITCODE
