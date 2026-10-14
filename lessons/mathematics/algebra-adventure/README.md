# Algebra Adventure: from boxes to equations

Twelve interactive episodes for children around nine with an adult. Equality leads to unknowns, inverse operations, equal groups, substitution, two-step equations, and two-clue stories. Episode twelve is optional. Six early examples connect familiar boxes/bar models to the same reasoning in algebra. The payoff is a consistent way to record justified operations and check increasingly involved problems; pictures and mental arithmetic remain welcome.

## View immediately

Open `app/index.html` in a desktop browser; no setup is needed to learn. `app/tutorial.html` explains the problem, the simpler approach, the reason for algebra, experiments, and limitations. Download `app/Algebra_Adventure.html` for a single self-contained file without collection navigation. Its JavaScript computes real answers, generated questions and equation moves. Robot gestures and schematic bars illustrate ideas. There is no backend or physical simulation.

## Setup and tasks

From this lesson directory, use the same wrapper for every task:

| Task | macOS / Linux | Windows PowerShell |
| --- | --- | --- |
| Provision | `sh setup.sh` | `./setup.ps1` |
| Diagnose | `sh setup.sh doctor` | `./setup.ps1 doctor` |
| Build | `sh setup.sh build` | `./setup.ps1 build` |
| Test | `sh setup.sh test` | `./setup.ps1 test` |
| Preview | `sh setup.sh preview` | `./setup.ps1 preview` |
| Clean generated lesson files | `sh setup.sh clean` | `./setup.ps1 clean` |

Preview listens on localhost port 8000 and serves the actual repository subdirectory URL, printed on startup. Its root is a single-lesson preview landing page. For the complete generated catalog, use the collection's existing `python tools/catalog.py build` / `serve` commands from repository root; that optional path requires Python 3.11+ and no packages. This lesson's setup does not install Python or other lessons' toolchains.

Node **22.23.3** is pinned for development, with no npm dependencies and therefore no package-manager lockfile needed. Wrappers use an exact matching installed version or install the official archive under `.tools/`. They verify its SHA-256 against the committed official release manifest. They require HTTPS access to nodejs.org for first setup, do not change global PATH, and do not elevate privileges. Reruns reuse the local installation. `node task.cjs <task>` is also available when that exact Node is on PATH.

Bootstrap prerequisites: Windows PowerShell 5.1+ with archive/hash cmdlets; or a POSIX shell, curl, tar, awk, and sha256sum or shasum on macOS/glibc Linux. x64 and arm64 archives are selected automatically. Unsupported platforms fail explicitly. Linux must meet the chosen Node binary's libc requirements; musl/Alpine is not supported by this bootstrap. Windows/macOS/Linux x64 setup and tests are included in the existing CI workflow; arm64 paths are provided but have not been exercised here.

If PowerShell blocks the script, review it and use a process-scoped policy permitted by your organization, for example `powershell -NoProfile -ExecutionPolicy Bypass -File ./setup.ps1 test`; do not change machine-wide policy. If downloads are blocked, allow the official host or install the exact Node version manually. A checksum failure stops installation; do not bypass it. Remove only this lesson's `.tools/node-v22.23.3-<platform>-<architecture>` directory to repair a damaged local runtime. Stop another server if port 8000 is occupied.

## Build and verification

`task.cjs` combines editable `course/` sources into `app/index.html`, an offline download, and an editable UTF-8 source bundle (`app/source.json`). Save the JSON `files` entries at their relative paths into a new directory to reconstruct the lesson; then run setup/build. Source bundles contain no runtime binaries. `clean` removes only these three generated files, not tutorial source or tools. Generated app outputs are committed because the collection publishes app/ directly. Rebuild them before committing; CI checks for drift.

Tests evaluate 2,400 generated problems independently, answer handling, hint/support tracking, profile isolation, v1 migration, legal/invalid moves, two-clue checks, all episode paths, later checks and reset confirmation. Additional tests verify relative hosted links, download parity, source-bundle fidelity and network restrictions in the HTML. The DOM harness is a stub: these checks do not establish real-browser layout/accessibility or teaching effectiveness. Upstream has Windows Electron integration tests, but those are not evidence for this hosted import. Manual browser check: open episode 1's algebra reveal, use balance controls in episode 2, solve episode 8, switch profiles and reload, then try the standalone download offline.

The default course names Quinn, Reagan and Guest are preserved. Collection progress uses `bdda-algebra-adventure-v2` to avoid colliding with the original course on the same origin. No migration from the original site's storage is attempted. Motion preference remains local. Moving origins/devices/files or clearing storage can lose progress. An ordinary browser remains capable of accessing the network outside the course.

## Provenance, scope and licenses

Imported at the repository owner's request from https://github.com/jeffadickson/AlgebraIntro at **3df7b81b070b76475b12698f19e860b42dc461ae**. Original source and deployment are unchanged. Imported: twelve lessons, expanded explanations, six box/bar bridges, Pip SVG animation, generated practice/labs, teacher guide, curriculum outline/review and course tests. Local adaptations: collection navigation/tutorial, scoped storage key, dependency-free Node build, source download and bootstrap.

The 200-page PDF publishing tools, raster artwork, and dedicated Windows reader remain in AlgebraIntro; they are not required by this browser lesson. The inline SVG robot is retained. No LICENSE file was present in the source revision and no new public redistribution license is asserted. The AI-assisted curriculum review is labeled as such, not a human teacher endorsement. No third-party runtime code is bundled in the published course.

References: [pinned original curriculum](https://github.com/jeffadickson/AlgebraIntro/tree/3df7b81b070b76475b12698f19e860b42dc461ae/docs/curriculum), [original workbook sources](https://github.com/jeffadickson/AlgebraIntro/tree/3df7b81b070b76475b12698f19e860b42dc461ae/workbook), [official Node release files and signed checksums](https://nodejs.org/dist/v22.23.3/).

To update: review a source revision, copy only relevant course changes, retain collection adaptations, record the revision, rebuild and test. To update Node: choose an exact official release, replace tools/node-version.txt and the official checksum manifest, update this document, and run the three-platform CI setup. Do not silently track latest. `docs/IMPORT_REQUEST.txt` preserves the import instructions; current code and requirements are authoritative.
