# Sly syntax laboratory

Actual C#/.NET execution using **sly 3.8.1**. The grammar and API source files
are byte-identical to the bounded simulator study; this package removes its
ANTLR comparison dependency and supplies a small command-line entry point.
No Java, browser framework or simulator is required. First restore requires
NuGet access. Use the .NET SDK pinned in global.json (10.0.402, latest patch).

From this extracted directory in PowerShell:

```powershell
$root = (Get-Location).Path
if (!(Test-Path -LiteralPath (Join-Path $root 'SlyTrial') -PathType Container)) { throw 'Run from extracted laboratory root' }
$artifacts = $env:CODEX_ARTIFACT_ROOT
if (!$artifacts -or !(Test-Path -LiteralPath $artifacts -PathType Container)) { throw 'Set CODEX_ARTIFACT_ROOT to an existing writable directory' }
$artifacts = Join-Path $artifacts ('sly-lab-'+[guid]::NewGuid().ToString('N'))
if (!(Test-Path -LiteralPath $artifacts -PathType Container)) { New-Item -ItemType Directory -Path $artifacts | Out-Null }
dotnet test ./SlyTrial.Tests --artifacts-path $artifacts -p:RestoreLockedMode=true
dotnet (Join-Path $artifacts 'bin/SlyTrial/debug/SlyTrial.dll') expression '1+2*3'
dotnet (Join-Path $artifacts 'bin/SlyTrial/debug/SlyTrial.dll') port 'a1 %vd(in 0) out diff'
```

The tests include 256 FsCheck cases with replay seeds `551,20261031` and
`552,20261031`. Parse failures return exit code 1, bad CLI arguments return 2,
and successful recognition returns 0. The output is syntax, not an evaluated
number. Commands inside control fragments remain inert text.

This is an educational fragment grammar, not complete SPICE support. Known
gaps include multiline-continuation line numbering and `.endc_extra` control
boundaries; typed vectors, numeric model references, ternary and Boolean
productions are omitted. It has no production-grade adversarial-depth guard.

The source archive includes no third-party binaries or package caches. Sly is
an MIT-licensed dependency fetched from NuGet; preserve its license and other
dependency notices when redistributing packages. The lesson collection has
not selected a collection-wide redistribution license for its own content.
