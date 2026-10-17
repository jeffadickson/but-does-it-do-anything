# TPL Dataflow update — 15 October 2026

- Recovered saved lesson version 7 after workspace maintenance; restored it onto
  the existing lesson branch in a fresh repository checkout.
- Added chapter 10, two complete C# source examples, five actual C# browser
  presets, an admission checkpoint, source downloads, and dynamic preset descriptions.
- Linux: .NET SDK 10.0.402 compiled the net10.0 native projects. With explicit
  major runtime roll-forward, all 14 xUnit cases passed. Four Dataflow cases
  use gates to verify capacity/admission, both output-order policies, and
  downstream fault releasing a capacity-blocked producer. No sleep-based ordering.
- Chromium offline WASM tests passed all five Dataflow presets plus existing
  acquisition/consumer presets and editor recovery checks. Tests require every
  owned pipeline task to be terminal on success, injected failure, and cancellation.
- Existing six JavaScript interactions, six exercises, five model tests,
  downloads, theme and mobile overflow checks passed. Dataflow checkpoint wrong
  and correct answers and all five example-loading buttons passed.
- HTML build verified 239 unchanged runtime hashes. Catalog check/build passed
  for four lessons. Inspected desktop and mobile rendering.
- Official Microsoft Dataflow overview, API contracts and pipeline guide checked
  15 October 2026; links are in the chapter. This update uses stable .NET 8/10 APIs.
- Browser results establish asynchronous coordination in single-threaded WASM,
  not multicore speedup, physical instrument behavior, durable storage, Windows/
  macOS execution, or results in other browser engines. Repository changes are
  local; this record does not assert GitHub Pages publication.

## Prior verification history

## Consumer pool addition

Real .NET WebAssembly execution passed for the new ConsumerPool.cs preset: each of 12 numbered readings appeared once, all loops completed. Existing acquisition presets and editor recovery checks passed in the same browser run.

## Async testing chapter addition

The new overlap theory passed for both completion orders. Current native suite: 10 passing xUnit/NSubstitute tests. Browser C# runtime was unchanged.

# Five-pass review verification · 15 October 2026

- Eight xUnit/NSubstitute tests passed using .NET SDK 10 with explicit major runtime roll-forward for the net10.0 target. New regression proves a synchronous second-driver exception does not abandon the first pending measurement.
- Enhanced Chromium WASM tests passed: four acquisition presets, unique edited-source output, drafts retained across preset switches, compile-error recovery, frozen source while running, Stop/restart, Code display, and mobile width.
- Five semantic model tests passed. Six JavaScript teaching interactions and six exercises passed browser checks, including countdowns, offline reading, downloads, themes, and mobile overflow.
- Revised Java CompositionLab compiled for Java 8 and ran on JDK 21. Its power dependency now agrees with the graph (1.001 W); anyOf is registered before dependent waits.
- Repository catalog validation passed. Build verifies every runtime asset against the committed SHA-256 manifest.
- Review is by an independent AI programmer reviewer, not human certification. Clean runtime rebuild, non-Linux native execution, and other browser engines were not revalidated in these passes.

## Previous revision evidence

# Browser execution revision · 15 October 2026

- Real Roslyn/.NET WASM execution passed in Chromium with all non-localhost requests blocked: concurrent acquisitions ~2.01 s; sequential ~6.00 s; counter timeout ~1.2 s with siblings completing ~2 s; cooperative cancellation ~0.8 s.
- Code controls reveal highlighted C#; editor source is sent directly to Roslyn. Java is source-only; the Java GIF and lifecycle simulator were removed from the page.
- Model values are fixed fixture readings, with Task.Delay simulating acquisition latency. No device protocol or hardware access is claimed.
- The bundled runner was reused from Pattern Atlas and its source included. Runtime repackaging script supplied; rebuilding that runtime from clean SDK installation was not revalidated in this change.
- Browser worker is single-threaded: native Thread example is desktop-only. Browser execution requires localhost/HTTP delivery of bundled assets; file:// supports reading and JavaScript diagrams.

- Updated file:// browser tests, five model tests, and repository catalog validation passed. Modern C# manual-thread program compiled and ran on .NET 10, producing 5.01 V.

## Earlier baseline verification (before this revision)

# Verification record — 2026-10-14

## Executed successfully in the Linux authoring environment

- Deterministic self-contained HTML build, approximately 115 KB including embedded native source.
- Five Node semantic tests: 6/4/2-second schedules, fault precedence, required completion barriers, failure cleanup permission, immutable Future terminal states.
- Playwright browser checks using Chromium headless shell: all seven simulations, all six exercise correct/incorrect/unanswered paths, source download, light/dark theme, mobile document overflow, offline loading with HTTP requests blocked, no browser JavaScript errors.
- Browser tests rerun using the lesson's pinned Node 22.23.3 and Playwright 1.51.1, after setup provisioned the locked dependencies.
- Visual inspection of desktop light theme, desktop dark instrument-lab section, and 390-pixel mobile dark layout.
- C# compiled for net10.0 using SDK 10.0.402. Seven xUnit/NSubstitute tests passed using .NET 10.0.13 with explicit major runtime roll-forward.
- The console companion and executable self-checks ran under both .NET 10.0.13 and the locally provisioned .NET 8.0.15 runtime. Checks cover success cleanup, fault cleanup, cancellation cleanup, retained cleanup errors, multiple aggregate faults and stream early termination.
- All three Java programs compiled and ran with provisioned Temurin 21.0.6+7. FutureLab and CompositionLab compiled with --release 8; VirtualLab with --release 21. Java 8 target-obsolescence warnings are expected.
- Linux Node bootstrap setup succeeded. Native provisioning downloaded .NET 10.0.100 and Temurin 21.0.6+7 and verified official metadata hashes before extraction. Corrected tar ownership portability and the Adoptium release-name endpoint during validation.
- Repository catalog check/build discovers four lessons, including the new lesson; all four root catalog unit tests pass. Generated collection back-link resolves from the lesson's published location.

## Explicit limits

- This environment's .NET 8 SDK CLI fails during process start-time inspection. Direct execution of the compiled console DLL under .NET 8 succeeds; xUnit was run through SDK/runtime 10. The CI matrix targets SDK/runtime 8 directly on standard runners. Do not describe that CI as passed before observing its result.
- The container requires a Chromium headless-shell launch with single-process/no-zygote flags; tests support this via LESSON_CHROMIUM. Standard CI uses Playwright's ordinary launch.
- Windows/macOS setup scripts and native downloads were not executed locally. Cross-platform test jobs were added to the existing workflow; validation of bootstrap entrypoints on those systems is a tracked follow-up.
- No physical devices, VISA drivers, precision triggers, or OpenTelemetry backend were exercised. Simulated values are not instrument validation evidence.
- The Java 5 source style is tested by a current compiler targeting Java 8, not by an original 2004 JVM.
- GitHub Pages publication is separate from a successful local build and is not claimed here.

Portability follow-up: https://github.com/jeffadickson/but-does-it-do-anything/issues/4
