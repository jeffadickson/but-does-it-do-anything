# Shared C# execution worker (v1)

`csharp-worker.js` is the catalog-level reusable Roslyn/.NET WebAssembly worker.
It accepts `{code: string, assetsBase?: string}` messages and emits `{type,value}` with types `status`, `started`, `stdout`, `error`, `done`, `fatal`. The worker executes the submitted, editable C# source through Roslyn. A fatal failure or timeout should be handled by terminating and recreating the Worker.

For a lesson located at `/lessons/<topic>/<slug>/`, construct a Worker with `../../../shared/components/csharp-worker.js` and `{type:'module'}`. The worker automatically selects the existing runtime assets at `lessons/languages-and-verification/java-futures-csharp-async/app/`. They are pinned and bundled there to retain standalone compatibility and avoid duplicating binary files. This location is an interim **asset backing store**, not an endorsement of the original lesson as an architectural dependency; migrating binary ownership to `shared/` requires updating the existing build, downloads, integrity checks and offline viewer before safely deleting the old copies.

For alternate assets, send `assetsBase` as an absolute HTTP(S) URL ending in `/`; it must contain `csharp-runtime/dotnet.js`, runtime bundles and `csharp-refs/references.bin`. The worker is a module worker, requires `DecompressionStream`, and must run from an HTTP(S) site, not `file://`. The browser sandbox cannot execute arbitrary native NuGet packages or physical device drivers. It uses one runtime per worker; stop cancels by termination. `error` can report compiler diagnostics while keeping the worker reusable.

The async lesson still retains its original worker for its standalone preview mode, while catalog-hosted use and the IoC lesson use this shared implementation.

Validation: `node --test shared/components/csharp-runner.test.cjs` checks static integration contracts. Real browser WebAssembly execution must be verified separately in Playwright/CI; static tests do not prove compilation works.
