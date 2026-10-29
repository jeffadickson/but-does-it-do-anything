# But Does It Do Anything?

**Explanations with working evidence.** A collection of educational lessons and interactive demonstrations across software, hardware, testing, and mathematics.

Each lesson starts with a concrete problem, shows a reasonable straightforward solution, introduces a change that makes it awkward, and demonstrates whether an improved design earns its complexity.

## Run locally

Install the .NET 10 SDK; no NuGet packages are required for the catalog tools.

```sh
dotnet run --project tools/Catalog -- check
dotnet run --project tools/Catalog -- build
dotnet run --project tools/Catalog -- serve
```

Open http://localhost:8000. The server binds only to localhost. Rebuild/restart after edits; this is not a hot-reload server.

## Reusable prompts

Start with [generic](prompts/generic.md) to develop a lesson on any topic. Change its first line, `TOPIC: xxx`, then follow its outline, implementation, review, and delivery stages. See the [prompt collection](prompts/README.md) for usage and versions.

## Add a lesson

```sh
dotnet run --project tools/Catalog -- new software-testing testing-toolkit --title "Testing without wishful thinking"
```

Edit the generated `lessons/software-testing/testing-toolkit/lesson.json` and `app/index.html`. Replace placeholder content, add the demo and its checks, then run check/build and commit. Do not publish unfilled templates. **The homepage discovers lesson.json files automatically. No manual card or catalog editing is required.**

For importing an existing project, copy the **[detailed, reusable lesson import prompt](docs/IMPORT_PROMPT.md)** into that project's development conversation. It includes metadata registration, educational requirements, cross-platform bootstrap, reproducible builds, CI checks, conflict handling, and GitHub Pages verification. See [CONTRIBUTING.md](CONTRIBUTING.md) for repository conventions. **No homepage edits are necessary:** `tools/Catalog` finds each lesson from `lesson.json` and discovers committed `DeepDives/*.html` and `DeepDivesKids/*.html` reports automatically.

## Where things live

- `site/config.json`: collection title, tagline, intro, and repository URL.
- `site/index.template.html`: top-level homepage layout and prose.
- `shared/styles/site.css`: shared visual style.
- `shared/components/`: small shared JavaScript components.
- `lessons/<topic>/<slug>/lesson.json`: one source of truth for each catalog entry.
- `lessons/<topic>/<slug>/app/`: publishable HTML, JS, CSS, runtime files and downloads.
- `tutorial/`, `examples/`, `tests/`, `assets/`: optional lesson source directories; copied into app only by an explicit lesson build step when needed on the website.
- `templates/lesson/`: starting point for new lessons.
- `tools/Catalog`: validation, scaffolding, site assembly, and local serving.
- `_site/`: generated website, including the searchable index, rendered deep-dive HTML, catalog.json, and deepdives.json; never edit or commit it.

JSON metadata keeps the core build dependency-free. There is no hand-maintained catalog.yaml: the generator discovers all lesson.json files.

## GitHub hosting

Git stores source history; **GitHub Pages hosts the static website**. The searchable homepage includes lessons plus committed `DeepDives` and `DeepDivesKids` reports, with newest reports first and direct rendered-HTML links. Set **Settings → Pages → Build and deployment → Source → GitHub Actions** once. Pushes to `main` now verify and deploy automatically; release-candidate tags (`v*-rc*`) remain verification-only, and manual dispatch is also available. See [CI policy](docs/CI_POLICY.md) and [.NET 10 migration](docs/NET10_MIGRATION.md). Before Pages is configured, checks still run and the deployment job is intentionally skipped with a setup notice.

Expected address after a successful deployment:
https://jeffadickson.github.io/but-does-it-do-anything/

That address is not evidence of a live deployment. Check the Actions deployment result. This repository is public and Pages content will be publicly accessible.

Pages can serve browser HTML/JS/WASM and downloads. It does not run a persistent Python/.NET server, database, Docker engine, or instrument connection. Those lessons need an honest simulation, a local companion, or a separately hosted backend. See [HOSTING.md](docs/HOSTING.md).

## Verification

```sh
dotnet run --project tests/Catalog.Tests
node --test lessons/software-design/facade/tests/*.cjs
dotnet run --project tools/Catalog -- check
dotnet run --project tools/Catalog -- build
```

Node 22.23.3 is used for the example's tests; it is not needed to build or serve the collection. Catalog CI uses .NET 10 and Node 22.23.3. Each imported lesson keeps its own pinned dependencies and documented checks; the catalog build never executes arbitrary commands from metadata.

## Current contents

**From Java Futures to C# async/await** is an offline interactive technical textbook for experienced Java programmers: seven simulations, six exercises, and runnable Java/C# instrument examples. Start at [its README](lessons/languages-and-verification/java-futures-csharp-async/README.md) or open its self-contained `app/index.html`.

**Algebra Adventure** is a twelve-episode browser course for children, with live equation activities and explicit connections from boxes and bars to letters. Start at [its README](lessons/mathematics/algebra-adventure/README.md); `sh lessons/mathematics/algebra-adventure/setup.sh preview` (or `./lessons/mathematics/algebra-adventure/setup.ps1 preview` on Windows) provisions just its tools and opens a local preview server. No tools are required to view its committed HTML.

**Facade: more than a shorter function call**. It models a missed instrument-settling policy update and demonstrates the maintenance benefit of a shared facade. It is a conceptual simulation, not physical hardware control.

Existing projects such as Pattern Atlas have not yet been migrated. Import them deliberately using the prompt; retain provenance, runtime assets, licenses and verification limits. Keep substantial products in their own repositories and import their educational demonstrations or link a pinned release.

## Licensing

No collection-wide redistribution license has been selected. Public visibility does not itself grant a software license. Preserve third-party license notices and each imported lesson's existing terms; select appropriate licenses before presenting the collection as broadly reusable open source.

## Optional Windows offline reader

[`viewer/`](viewer/README.md) contains the dedicated Chromium/Electron reader, its Windows firewall guard, tests, and packaging scripts. It bundles Algebra Adventure and opens other self-contained HTML books. Run `./viewer/setup.ps1` and `./viewer/setup.ps1 build` on Windows to build it, or download `OfflineBookReader-Windows-x64` from a successful **Windows reader** Actions run. First-run firewall installation requires an explicit administrator action; normal reading does not. This optional application is separate from GitHub Pages and ordinary lesson setup.

