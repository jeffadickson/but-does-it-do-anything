# .NET 10 migration status

Date: 2026-10-15. This branch retargets tracked lesson C# project TFMs and SDK setup/CI pins from .NET 8 to .NET 10.

## Source migration
- Java Futures and async tests: net10.0; SDK 10.0.100; async setup release-metadata channel 10.0.
- Checkout lab: net10.0; SDK 10.0.100; shell and PowerShell bootstrap channel 10.0.
- Instrument lab: net10.0; SDK 10.0.100; shell and PowerShell installer pins.
- Root site CI: setup-dotnet 10.0.100 for source compilation and test runs.

## Explicitly unverified / required before merge
1. Restore the Java Futures tests under .NET 10 with locked mode, regenerate and commit packages.lock.json if NuGet dependency resolution differs. Its framework group was retargeted mechanically; package hashes are not independently verified for .NET 10.
2. Build and run all C# tests on supported operating systems. This environment has no .NET executable and cannot fetch the SDK from github.com.
3. The Java Futures browser Roslyn/.NET WebAssembly runtime is prebuilt and remains at its original runtime version until rebuilt. Source TFM changes alone do not upgrade it. Track its binary assets, checksums, runner assembly, Playwright tests, offline viewer packaging.
4. The separate draft branch `lesson/dsl-adventures-parlot` already carries a .NET 10 upgrade. When integrating, ensure no older .NET 8 project configuration is reintroduced.
5. Check documentation that describes *historical .NET 8 behavior* separately from commands that install or target a current SDK. Historical examples should not be rewritten as if they happened on .NET 10.

CI remains opt-in on branches where the release-candidate policy is adopted. Run manual/RC verification before declaring a supported .NET 10 release.

## October 15 follow-up: source audit and explicit runtime packaging

- Fixed a real setup bug: the checkout lesson's shell and PowerShell scripts installed the .NET 10 SDK but still tested for an installed .NET 8 SDK.
- Corrected the checkout/async READMEs that had outdated descriptions of the active runtime target.
- Added `python tools/check_net10_lessons.py` to enumerate C# projects and SDK pins and fail on pre-10 TFMs or SDKs. Independently checked the seven tracked existing C# projects and three SDK pins through the GitHub connector: all currently report .NET 10 targets/pins on this branch. This is **source verification**, not a successful build.
- Added `lessons/languages-and-verification/java-futures-csharp-async/tools/rebuild-runtime.py`: use a locally installed .NET 10 SDK, publish the Roslyn WASM runner, resolve .NET 10 reference assemblies, invoke the existing bundler, regenerate SHA-256 hashes and verify packaging. `--test` additionally runs the lesson's browser test suite.
- Added SDK-selection unit tests and an intentionally **manual-only** `Rebuild and verify .NET 10 browser runner` Actions workflow. The workflow builds the candidate runtime, performs Chromium checks, regenerates the lockfile with a real restore, and uploads both as a short-lived artifact. It does not commit assets or auto-publish.
- Explicit cost policy also applied to the root and Windows-reader workflow on this branch: full CI runs only on `v*-rc*` tags or manual dispatch; manual dispatch on `main` publishes Pages.
- Run `python tools/check_net10_lessons.py` before merging. From the async lesson directory, run `python tools/rebuild-runtime.py --test` on a .NET 10 / Node / Playwright-equipped machine. Review and commit the generated assets and lockfile after verification.

### Environment and release caveat

The current local container has no .NET SDK, and DNS cannot resolve `dot.net`, `api.nuget.org` or `github.com`. Consequently, **the rebuilt browser binaries and lockfile have not been produced**, and no successful .NET 10 compile, NuGet restore or browser test is claimed in this turn. A manual build on a connected runner is still required. The bundled browser binary should not be represented as upgraded merely because the source project targets net10.0.

## PR integration checkpoint — 17 October 2026

- Main advanced since the draft PRs began; verify the latest main changes before merging.
- Merge order remains shared IoC runner (#8), .NET 10 migration (#12), then DSL Adventure (#10), contingent on checks.
- Do not assume clean GitHub compare results imply conflict-free merge across sibling branches.
- Browser smoke tests exist for IoC; a green run for its final head is still needed.
- Runtime CI remains manual by policy; absence of a run is not a pass.
