# From Java Futures to C# async/await: Twenty Years of Asynchronous Programming

An offline interactive textbook for an experienced programmer returning from Java circa 2004–2006. Its fourteen chapters develop one laboratory scenario through Futures, CompletableFuture, virtual threads, Tasks, await, cancellation, streams, causal verification and an experiment runner.

## Read it

Open **app/index.html** directly for offline reading and JavaScript teaching diagrams. To execute real C#, keep the bundled app directory intact and start a local static server:

```sh
python3 start.py
# or, with Node installed:
node tools/serve.cjs
# or provision the lesson's pinned Node first:
sh setup.sh setup
sh setup.sh preview
```

Open http://127.0.0.1:8080. No internet, account, application backend, or installed .NET SDK is needed to run the bundled C# workbench. Roslyn compiles editable C# in a .NET WebAssembly worker. Approximately 21 MB of local runtime/compiler assets load on first run. Browser security prevents module workers from running from a double-clicked file:// page. Modern browsers must support WebAssembly, module workers, and DecompressionStream.

Java is source-only. C# Code buttons reveal highlighted, copyable source. The instrument workbench runs actual C# with sequential, concurrent, timeout, and cooperative-cancellation presets. Timer-backed models return 5.01 V DC, 1000 Hz, and 2 Vpp; they do not simulate electronics or connect to hardware. Results include real C# timestamps, shown after completion. Other diagrams remain explicitly labeled JavaScript models. Six exercises give immediate feedback.

The manual Thread example uses modern C# and must run in a desktop console project: this single-threaded WASM build does not support Thread.Start. Stop runtime kills the browser worker; use the cancellation preset for CancellationToken behavior. Complete excerpts and source downloads remain available offline.

## Develop and verify

The shell and PowerShell entry points bootstrap only this lesson's pinned Node 22.23.3, using committed SHA-256 hashes. They do not change system PATH, require elevation, or provision unrelated lessons. You need a shell plus curl/tar/hash utilities on macOS/Linux, or PowerShell on Windows. First-time development setup downloads dependencies; subsequent reading is completely offline.

```sh
sh setup.sh setup           # provision Node, npm ci, Chromium, build HTML
sh setup.sh doctor          # show available tools
sh setup.sh build           # regenerate app/index.html from src and examples
sh setup.sh test-unit       # five semantic model tests
sh setup.sh test            # rebuild, model tests, real browser interaction tests
sh setup.sh native-setup    # optional local .NET SDK 10.0.100 + Temurin JDK 21.0.6+7
sh setup.sh native-test     # restore locked NuGet packages, xUnit, self-tests, Java programs
sh setup.sh preview        # http://127.0.0.1:8080 (Ctrl+C to stop)
sh setup.sh clean           # remove build/test outputs, retain installed tools
```

On Windows, replace `sh setup.sh` with `./setup.ps1`. Node users may run `node task.cjs <task>` directly. Reading needs none of these tools. Default setup provisions browser development only; `native-setup` explicitly provisions both native toolchains. Archive hashes are checked against official HTTPS Microsoft/Adoptium release metadata; Node hashes are committed. Native metadata remains an online trust dependency, not an independently signed offline lock. Temurin binaries are supplied under their upstream terms, not bundled in this repository.

If Chromium reports missing Linux shared libraries, install its listed OS packages, or run `npx playwright install-deps chromium` explicitly on a machine where you administer system packages. The bootstrap does not silently elevate privileges. Tests may reuse `LESSON_CHROMIUM=/absolute/path/to/headless_shell`; native tests accept `LESSON_DOTNET` and `LESSON_JAVAC` absolute paths. Windows/macOS commands and CI matrix are provided; consult CI before claiming those platforms passed.

## Native sources

- `examples/java/FutureLab.java`: Java 5-style Callable syntax; compiled with a modern JDK using `--release 8`, not claimed tested on an original Java 5 VM. Demonstrates timed get, exception cause and cancellation request.
- `examples/java/CompositionLab.java`: Java 8 composition with a dedicated executor for blocking simulated I/O.
- `examples/java/VirtualLab.java`: Java 21 stable virtual threads. No structured-concurrency preview dependency.
- `examples/csharp/Program.cs`: complete .NET 8 console simulation, public instrument interfaces, serial session protection, async iterator, timeout patterns, and frequency-response experiment runner. Ctrl+C requests cancellation. `--self-test` runs executable checks.
- `tests/WorkflowTests.cs`: xUnit/NSubstitute tests with incomplete-task gates, both configuration completion orders, failure cleanup, cancellation token independence, WhenAll fault ownership and WaitAsync behavior.

Manual commands from this lesson directory:

```sh
dotnet restore tests/AsyncLab.Tests.csproj --locked-mode
dotnet test tests/AsyncLab.Tests.csproj --no-restore -c Release
dotnet run --project examples/csharp -c Release -- --self-test
javac --release 8 -d .build/java examples/java/FutureLab.java examples/java/CompositionLab.java
javac --release 21 -d .build/java examples/java/VirtualLab.java
java -cp .build/java FutureLab
java -cp .build/java CompositionLab
java -cp .build/java VirtualLab
```

Create `.build/java` before manual javac commands. Tests restore pinned direct packages plus committed transitive NuGet locks. The SDK selection prefers 10.0.100 and allows newer major SDKs; the target runtime remains .NET 8. A newer SDK alone does not supply the .NET 8 runtime. Native setup installs the matching runtime. `DOTNET_ROLL_FORWARD=Major` is an explicit testing alternative, not the baseline configuration.

The HTML embeds code from those exact files during build; edit source, then regenerate. Body snippets are clearly labeled excerpts and can depend on surrounding variables. Downloaded tests should be placed in `tests/` beside the project file, with the console project at `examples/csharp/`, preserving the relative ProjectReference. The ZIP preserves this layout.

## Integration and automation

`lesson.json` registers this lesson under `languages-and-verification`. The root catalog automatically generates navigation; do not edit `_site`. Only `app/` is published. Native source is embedded as downloadable text in the HTML, so Pages needs no special artifact packaging. The existing site workflow builds/verifies this lesson; a dedicated job in the same workflow tests browser and native companions across its platform matrix. No second publisher is added.

From repository root:

```sh
python -m unittest discover -s tests -v
python tools/catalog.py check
python tools/catalog.py build
```

## Scope and limitations

- Timing diagrams are deterministic teaching models; browser timers and OS scheduling are not real-time guarantees.
- The frequency counter injects one timeout. Native tests cover multiple faults and aggregate retention.
- The dependency verifier models normal configuration and acquisition-failure paths. The C# runner separately covers startup cancellation and cleanup error handling.
- The software DMM returns a constant amplitude; frequency-response data demonstrates orchestration, not electrical response or calibration accuracy.
- Cancellation requests, instrument abort and verified output disable are different. This is not a certified hardware safety controller. The cleanup token depends on a cooperative driver; no hard deadline is promised.
- ActivitySource instrumentation and JSON logs are present; no external OpenTelemetry exporter is configured.
- No real VISA session, hardware trigger timing or native driver thread behavior is tested.
- StructuredTaskScope is **Java 27 seventh preview**, verified against official Oracle documentation on 2026-10-14. It is not described as stable and is not included in the stable native build.
- Newer notebook ideas (marimo, Quarto/Observable) are discussed as UI/analysis inspiration; no live kernel is embedded.

See `VERIFICATION.md` for actual execution evidence and outstanding checks.

## Provenance and licensing

Original lesson implementation created for `jeffadickson/but-does-it-do-anything`, based on the user's requested curriculum; not imported from another code repository. Node bootstrap files were adapted from this repository's Algebra Adventure lesson. Explanations and companion code were newly authored; official source links are collected in the HTML. The reading HTML uses no external fonts or images. The browser workbench bundles third-party .NET and Roslyn scripts/assemblies, with notices in browser-runner/. Dependency packages retain their upstream licenses. This repository has no collection-wide license; this addition does not invent a redistribution license.

## Browser runtime provenance and rebuild

`app/csharp-runtime`, `app/csharp-refs`, and `app/csharp-worker.js` reuse the existing Pattern Atlas lesson's .NET 10 / Roslyn 4.14 runner. `browser-runner/Program.cs` is its source. Runtime payloads are gzip-compressed `.bin` assets; the loader decompresses them locally. `browser-runner/runtime-sha256.json` records every bundled runtime byte. These assets are included in the downloadable package and GitHub Pages output. The C# source shown in the workbench is exactly the source sent to the compiler.

The runtime is prebuilt so lesson readers need no SDK. To rebuild it, install .NET 10 SDK and its WebAssembly toolchain, restore `browser-runner/PatternRunner.csproj`, publish without trimming, and run `python3 tools/package_runtime.py <publish-wwwroot> --reference-dir <SDK-reference-directory>`. That script packs assemblies and compiler references and updates hashes. Rebuilding the runtime is optional, requires NuGet access, and is separate from the ordinary HTML build.

`node tests/wasm.cjs` starts its own static server and tests real browser execution for four acquisition scenarios, edited-source sentinel execution, draft preservation, compiler-error recovery, stop/restart, formatted Code controls, and mobile width. It allows only localhost traffic. `tests/browser.cjs` separately verifies file:// reading and teaching diagrams. SDK 10 runtime files and Roslyn are MIT-licensed upstream components; see `browser-runner/THIRD_PARTY.md`.

## Five-pass expert review

See REVIEW.md for five sequential independent AI programmer review/revision passes and the resulting corrections. Build now verifies the recorded SHA-256 of every bundled runtime asset and rejects missing or altered files. This is integrity checking against the recorded local bundle, not external publisher authentication.

The mock-verification chapter also explains what async complicates in testing: pending versus completed tasks, overlap, completion-order variation, failure ownership, cancellation, and cleanup. A gated xUnit/NSubstitute theory demonstrates overlap in both completion orders without sleeps.

The Consumer pool workbench preset executes a complete bounded-channel example with one producer and three competing consumers. It demonstrates asynchronous backpressure, writer completion, and explicit sibling cancellation on failure.

## TPL Dataflow deep dive

Chapter 10 extends the channel consumer pool into processing blocks and a bounded
acquisition → calibration → recording pipeline. It covers admission versus
completion, ordering, capacity accounting, downstream fault supervision,
cancellation, routing versus broadcast, fan-in completion, and testing.

Use the chapter's Load buttons, then Run C# in the workbench. Five presets execute
actual C#: consumer block, ordered pipeline, unordered pipeline, recorder failure,
and cancellation. Logs are returned at the end; timestamps describe actual C#
execution. Task.Delay models I/O, and no hardware or file writes occur. This is
single-threaded WebAssembly concurrency, not evidence of multicore CPU speedup.

To run either example separately with .NET 8 or later:

```sh
dotnet new console -n DataflowDemo -f net10.0
# Copy examples/csharp/DataflowLab.cs.txt into DataflowDemo/Program.cs.
# Or use DataflowPool.cs.txt for the compact consumer block.
dotnet run --project DataflowDemo
```

Use an SDK that supports the selected target framework; change net10.0 to net10.0
when using only the .NET 10 targeting/runtime installation. No additional Dataflow
package is required for these targets. Edit the three variables at the top of
DataflowLab.cs to select ordering, recorder failure, and timed cancellation.
Both files are also downloadable from the HTML. The full native xUnit suite
includes DataflowTests.cs; `node tests/wasm.cjs` exercises all five browser cases.
The separate admission checkpoint does not change the six original exercise tally.

Dataflow prose lives in src/dataflow.html and is embedded by build.cjs. No network
is needed for reading or execution after downloading the complete lesson pack;
serve it with python3 start.py as described above.
