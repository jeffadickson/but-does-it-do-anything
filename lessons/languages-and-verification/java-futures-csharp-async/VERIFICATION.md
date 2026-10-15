# Verification record — 2026-10-14

## Executed successfully in the Linux authoring environment

- Deterministic self-contained HTML build, approximately 115 KB including embedded native source.
- Five Node semantic tests: 6/4/2-second schedules, fault precedence, required completion barriers, failure cleanup permission, immutable Future terminal states.
- Playwright browser checks using Chromium headless shell: all seven simulations, all six exercise correct/incorrect/unanswered paths, source download, light/dark theme, mobile document overflow, offline loading with HTTP requests blocked, no browser JavaScript errors.
- Browser tests rerun using the lesson's pinned Node 22.23.3 and Playwright 1.51.1, after setup provisioned the locked dependencies.
- Visual inspection of desktop light theme, desktop dark instrument-lab section, and 390-pixel mobile dark layout.
- C# compiled for net8.0 using SDK 10.0.402. Seven xUnit/NSubstitute tests passed using .NET 10.0.13 with explicit major runtime roll-forward.
- The console companion and executable self-checks ran under both .NET 10.0.13 and the locally provisioned .NET 8.0.15 runtime. Checks cover success cleanup, fault cleanup, cancellation cleanup, retained cleanup errors, multiple aggregate faults and stream early termination.
- All three Java programs compiled and ran with provisioned Temurin 21.0.6+7. FutureLab and CompositionLab compiled with --release 8; VirtualLab with --release 21. Java 8 target-obsolescence warnings are expected.
- Linux Node bootstrap setup succeeded. Native provisioning downloaded .NET 8.0.408 and Temurin 21.0.6+7 and verified official metadata hashes before extraction. Corrected tar ownership portability and the Adoptium release-name endpoint during validation.
- Repository catalog check/build discovers four lessons, including the new lesson; all four root catalog unit tests pass. Generated collection back-link resolves from the lesson's published location.

## Explicit limits

- This environment's .NET 8 SDK CLI fails during process start-time inspection. Direct execution of the compiled console DLL under .NET 8 succeeds; xUnit was run through SDK/runtime 10. The CI matrix targets SDK/runtime 8 directly on standard runners. Do not describe that CI as passed before observing its result.
- The container requires a Chromium headless-shell launch with single-process/no-zygote flags; tests support this via LESSON_CHROMIUM. Standard CI uses Playwright's ordinary launch.
- Windows/macOS setup scripts and native downloads were not executed locally. Cross-platform test jobs were added to the existing workflow; validation of bootstrap entrypoints on those systems is a tracked follow-up.
- No physical devices, VISA drivers, precision triggers, or OpenTelemetry backend were exercised. Simulated values are not instrument validation evidence.
- The Java 5 source style is tested by a current compiler targeting Java 8, not by an original 2004 JVM.
- GitHub Pages publication is separate from a successful local build and is not claimed here.

Portability follow-up: https://github.com/jeffadickson/but-does-it-do-anything/issues/4
