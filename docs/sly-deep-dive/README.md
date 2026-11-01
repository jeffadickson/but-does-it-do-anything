# Sly: a language hiding in your C# attributes

The [self-contained article](../../DeepDives/2026-10-31-sly-csharp-parser-deep-dive.html) explains the lexer/parser boundary, annotated grammar methods, expression precedence, lexical modes, syntax trees, and framework choices. Its browser explorer displays recorded .NET results; it does not run Sly or evaluate expressions. The simulator retains ANTLR.

## Sources and evidence

- `template.html.txt`: original HTML/CSS/JS source template.
- `evidence.json`: bounded historical trial evidence, including 23 shared fixed cases and six challenges. Source revision and measurement scopes are explicit.
- `lab/`: pinned Sly 3.8.1 source laboratory and 30 tests, including 256 seeded FsCheck cases. See its README for standalone commands. The API, grammar, and tests preserve the original trial source; the CLI is independent of the simulator.
- `requirements.sdoc`: stable requirement SLY-HTML-001 (Draft).
- `verification.json`: checks actually executed for this report, coverage scope, and remaining limitations.

The source ZIP embedded in the generated page contains only the ten laboratory source/lock/documentation files. It is generated deterministically and includes a displayed SHA-256 checksum. No third-party binaries, caches, or private machine paths are included. Dependency references are not a redistribution license for this collection's own content.

## Rebuild and verify

Use PowerShell, the .NET 10 SDK pinned by the laboratory, and Node.js (local verification used 24.20.0; the existing site workflow uses 22.23.3). Start at the repository root:

```powershell
$repo = (Get-Location).Path
if (!(Test-Path -LiteralPath (Join-Path $repo 'docs/sly-deep-dive/lab') -PathType Container)) { throw 'Run from repository root' }
$root = $env:CODEX_ARTIFACT_ROOT
if (!$root -or !(Test-Path -LiteralPath $root -PathType Container)) { throw 'Set CODEX_ARTIFACT_ROOT to an existing writable directory' }
$out = Join-Path $root ('sly-report-'+[guid]::NewGuid().ToString('N'))
if (!(Test-Path -LiteralPath $out -PathType Container)) { New-Item -ItemType Directory -Path $out | Out-Null }
$env:TEMP=$out; $env:TMP=$out

dotnet test ./docs/sly-deep-dive/lab/SlyTrial.Tests --artifacts-path (Join-Path $out 'lab-build') -p:RestoreLockedMode=true --collect:'XPlat Code Coverage' --results-directory (Join-Path $out 'lab-coverage')
if ($LASTEXITCODE) { throw 'Laboratory failed' }
dotnet run --file ./tools/BuildSlyDeepDive.cs -- $repo $out
if ($LASTEXITCODE) { throw 'Report generation failed' }
node --test ./tests/sly-deep-dive.test.cjs
if ($LASTEXITCODE) { throw 'Page logic checks failed' }
dotnet run --file ./tools/VerifySlyDeepDive.cs -- $repo $out
if ($LASTEXITCODE) { throw 'Catalog/download checks failed' }
```

The integration helper creates an isolated catalog snapshot under the chosen output directory, runs the existing catalog regression/check/build commands, verifies discovery, extracts the published ZIP, and runs its tests with locked restoration. It deliberately uses the existing catalog rather than adding a second site builder. Raw logs, coverage, screenshots, and disposable outputs remain outside Git. These C# file apps are build helpers, not Native AOT executables.

StrictDoc 0.30.4 parsed `requirements.sdoc` with its real `SDReader.read` API. No new Stryker campaign was executed for the article generator or browser UI; historical trial mutation results remain separately scoped in the article. Passing fragment tests do not qualify a full deck parser, production safety, performance, Linux, or Native AOT.
