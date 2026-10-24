# Invent a Language: Adventures, Turtles, Parlot

Version **0.1.0** — 2026-10-15. Browser gameplay is a **real JavaScript interpreter**, not a Parlot or .NET WASM execution. Real Parlot source is in `examples/ParlotDsl` and requires a .NET SDK and first-time NuGet restore. Open `app/index.html` offline for the two browser steppers, or `dotnet run --project tools/Catalog -- serve` from repository root.

Project issue #9 tracks true Parlot-in-browser integration, native compilation/verification, accessibility and full release review. Avoid triggering costly full CI on each push; prefer the release candidate/manual policy.

## Actual Parlot browser application

A separate **Blazor WebAssembly app** now lives in `wasm/`. It parses commands with Parlot 1.5.8, executes the adventure and turtle in C# and renders the turtle in SVG. The original `app/index.html` continues as a zero-install JavaScript teaching playground.

To build on a machine with the .NET 10 SDK:

```sh
cd lessons/software-design/dsl-adventures
make doctor
make test
make build
dotnet run --project tools/Catalog -- build
dotnet run --project tools/Catalog -- serve
```

Then open `lessons/software-design/dsl-adventures/parlot/index.html` from the catalog server. The published WASM files are intentionally **not yet committed**; the main-page link works after the explicit publish step. Alternatively run Actions → Build Parlot DSL WebAssembly → Run workflow and use its downloadable artifact. This workflow is manually triggered to honor CI cost preferences.

**Verification status:** Source and publish instructions committed, but build and end-to-end browser operation have not been executed in this environment (no .NET SDK). A successful artifact build followed by browser smoke tests is mandatory before calling this release complete.
