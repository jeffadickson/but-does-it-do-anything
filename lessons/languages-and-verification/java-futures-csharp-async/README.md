# From Java Futures to C# async/await: Twenty Years of Asynchronous Programming

An offline interactive textbook for an experienced programmer returning from Java circa 2004–2006. Its fourteen chapters develop one laboratory scenario through Futures, CompletableFuture, virtual threads, Tasks, await, cancellation, streams, causal verification and an experiment runner.

## Read it

Open **app/index.html** directly in an ordinary modern browser. No account, backend, SDK, package installation or network connection is needed. In the downloadable pack, the same file is also provided as top-level **index.html**.

Seven simulations: sequential/concurrent/pool timing; Future lifecycle; completion dependency graph; await state transitions; instrument lab with timeout/cancellation; voltage stream; invocation/completion constraint verifier. Six exercises provide immediate feedback and reference solutions. The page has copyable highlighted source, individual source downloads, light/dark mode, responsive layouts, local progress, keyboard controls and reduced-motion support.

Every interactive runtime is **JavaScript modeling execution semantics**. The browser does not execute Java/C# or access physical hardware. Native examples are real compilable programs with simulated devices. The in-page custom graph is not an NSubstitute feature. External reference links and the hosted collection back-link need the appropriate network/site context; neither is needed to use the lesson.

## Develop and verify

The shell and PowerShell entry points bootstrap only this lesson's pinned Node 22.23.3, using committed SHA-256 hashes. They do not change system PATH, require elevation, or provision unrelated lessons. You need a shell plus curl/tar/hash utilities on macOS/Linux, or PowerShell on Windows. First-time development setup downloads dependencies; subsequent reading is completely offline.

```sh
sh setup.sh setup           # provision Node, npm ci, Chromium, build HTML
sh setup.sh doctor          # show available tools
sh setup.sh build           # regenerate app/index.html from src and examples
sh setup.sh test-unit       # five semantic model tests
sh setup.sh test            # rebuild, model tests, real browser interaction tests
sh setup.sh native-setup    # optional local .NET SDK 8.0.408 + Temurin JDK 21.0.6+7
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

Create `.build/java` before manual javac commands. Tests restore pinned direct packages plus committed transitive NuGet locks. The SDK selection prefers 8.0.408 and allows newer major SDKs; the target runtime remains .NET 8. A newer SDK alone does not supply the .NET 8 runtime. Native setup installs the matching runtime. `DOTNET_ROLL_FORWARD=Major` is an explicit testing alternative, not the baseline configuration.

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

Original lesson implementation created for `jeffadickson/but-does-it-do-anything`, based on the user's requested curriculum; not imported from another code repository. Node bootstrap files were adapted from this repository's Algebra Adventure lesson. Explanations and companion code were newly authored; official source links are collected in the HTML. No third-party fonts, scripts or images are embedded. Dependency packages retain their upstream licenses. This repository has no collection-wide license; this addition does not invent a redistribution license.
