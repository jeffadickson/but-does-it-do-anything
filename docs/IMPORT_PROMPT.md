# Reusable prompt: import a lesson into But Does It Do Anything?

Copy the text below into the development conversation for the project you want to import. Replace the four bracketed fields. This is an **implementation request**, not an invitation to generate a plan only.

---

## Import request

Act as a senior software engineer, build systems engineer, testing lead, technical educator, and release engineer.

Import the educational lesson(s) and interactive demonstration(s) from the current project into:

**Destination:** https://github.com/jeffadickson/but-does-it-do-anything

- **Lesson title:** [TITLE]
- **Topic:** [software-design | software-testing | languages-and-verification | hardware | mathematics]
- **Slug:** [lowercase-hyphenated-slug]
- **Source:** [repository URL + revision, local directory, attached source archive, or named files]

Complete the implementation, validation, documentation, GitHub integration, and (where authorized and verified) publication. Do not stop at a proposal. Make routine engineering decisions autonomously, preserve unrelated work, and report genuine blockers rather than claiming unexecuted tests passed.

### 1. Inspect source, destination, and concurrent changes

1. Read destination `README.md`, `CONTRIBUTING.md`, `docs/IMPORT_PROMPT.md`, all applicable `AGENTS.md` files, and the actual catalog/build/Pages workflow. Read instructions in the source repository too.
2. Identify the source's teaching objectives, audience, current examples, runtime requirements, interactive behavior, test coverage, references, licenses, and downloads. Classify **actual browser-executed code**, **conceptual simulation**, **recorded output**, and **local/server-only execution** accurately.
3. Check `main`, open pull requests, existing lesson IDs, and any shared-file changes before modifying the destination. Do not overwrite other lesson imports or concurrent CI changes.
4. Preserve the source project's repository and deployment. Import its educational content rather than copying an unrelated production system wholesale.

### 2. Use the existing lesson structure

Place the material at `lessons/<topic>/<slug>/` with:

```text
lesson.json                 # required metadata, source of truth for catalog
app/index.html              # required static, publishable entrypoint
app/tutorial.html           # if useful; publishable tutorial
README.md                   # teaching goals, running, provenance, constraints
examples/                   # local companion source; not automatically published
tests/                      # test source; not automatically published
assets/                     # optional source assets
setup.sh / setup.ps1        # when a toolchain must be provisioned
task.sh / task.ps1          # or native build commands, if appropriate
```

- Follow existing repository conventions rather than creating duplicate infrastructure.
- Create/update `lesson.json` with `id`, `title`, `summary`, `topic`, `level`, `mode`, `languages`, `tags`, `prerequisites`, and `entrypoint`. The ID and topic must match the directory. Use a truthful primary mode: `browser`, `simulation`, `local-tools`, or `hosted`.
- **Do not edit generated `_site/index.html` or `_site/catalog.json`** or manually add homepage cards. The `tools/Catalog` generator discovers lessons by metadata.
- Only files within `app/` are copied into the published site automatically. If users need example-source downloads, produce an appropriate distributable inside `app/` through an explicit build or documented checked-in artifact.
- Use relative URLs, e.g. `../../../index.html` for the back link, compatible with `/but-does-it-do-anything/` on GitHub Pages.
- Keep secrets, machine-specific files, databases, build caches, paid SDKs, and unrelated binaries out of the published site. Preserve license and attribution requirements.

### 3. Make the educational experience convincing

The lesson must clearly establish:

1. **The problem:** a realistic, observable problem rather than a syntax-only showcase.
2. **The straightforward solution:** the simplest reasonable implementation and why someone would choose it.
3. **The pressure:** a changed requirement, failure, scaling issue, or maintenance burden that exposes a limitation.
4. **The improvement:** working code that addresses that specific problem.
5. **The experiment:** an editable/runnable demonstration where possible, meaningful tests, intentionally injected failures, and visible evidence.
6. **The tradeoffs:** added complexity, limitations, when the improved technique is overkill, and what the tests do *not* establish.

Include a clear introduction, labeled controls, responsive accessible layouts, a readable code example, explanatory walkthrough, and appropriate official/primary references. Keep interactivity working. Do not misrepresent a JavaScript model as .NET, a simulated database as PostgreSQL, or illustrative output as verified execution.

### 4. Choose and pin the correct tooling

Select the build system by actual project needs; do not introduce Make merely by habit.

- **C# / F#:** .NET CLI/MSBuild/NuGet, `global.json`, and NuGet lockfiles where applicable.
- **Python:** `uv` + `pyproject.toml`/`uv.lock` if dependencies are needed, otherwise retain small standard-library scripts.
- **Rust:** Cargo and `Cargo.lock`.
- **C/C++:** CMake + Ninja, using vcpkg/Conan where helpful.
- **Java/Kotlin:** Gradle or Maven with repeatable dependency resolution.
- **JS/TS:** preserve an appropriate package manager/lockfile; use pnpm for new projects if justified.
- **Ruby:** Bundler and `Gemfile.lock`.
- **FPGA/HDL:** retain suitable simulator/synthesis workflows; pin available tools and document proprietary requirements.

When tools are needed, provide Windows PowerShell and macOS/Linux bootstrap entry points that detect installed versions, provision missing redistributable toolchains locally from official sources with checksum/signature verification where supported, restore pinned dependencies, and work safely if rerun. Do not silently elevate privileges, accept proprietary licenses, change unrelated global toolchains, or start heavyweight infrastructure. If Docker, vendor tools, or administrator action is necessary, make it explicit and optional.

Provide documented equivalents of `setup`, `doctor`, `build`, `test`, `preview`, and `clean` (plus `integration` when useful). **Default setup provisions only this lesson**, not the entire collection.

### 5. Verify real behavior and deployment compatibility

1. Run lesson-specific unit tests, failure-path tests, and integration tests when their real dependencies are available.
2. Run root tests relevant to shared modifications, then `dotnet run --project tools/Catalog -- check` and `dotnet run --project tools/Catalog -- build`.
3. Inspect generated `_site/catalog.json`, `_site/index.html`, the lesson entrypoint, linked assets, downloads, and all navigation under the GitHub Pages project subpath.
4. Verify browser controls and responsive behavior when a browser runtime is available. Record when unavailable.
5. Check the build in a clean checkout/environment when practical. Do not claim Windows/macOS support is exercised merely because Linux passed.
6. Extend the **existing** `.github/workflows/site.yml` only as necessary. Preserve checks for other lessons, deployment gating, and the existing Pages workflow; do not add a second competing publisher.
7. GitHub Pages serves static HTML/JS/WASM/downloads, not live Docker databases or .NET services. Offer a runnable local companion or explicitly hosted backend for features requiring those resources.
8. Do not fabricate CI outcomes, publication URLs, test results, or dependency reproducibility.

### 6. Document the lesson and its provenance

Update its `README.md` with: what it teaches, project/source revision, authorship and licensing/attribution, quick start, exact setup/doctor/build/test/preview/clean commands, supported operating systems and versions, actual browser behavior versus simulation, optional services, reproducibility caveats, troubleshooting, references, and how to regenerate the published artifacts.

If a useful original prompt exists, retain it as `docs/BUILD_PROMPT.md` **inside the lesson** for historical reference; use the actual current source and requirements as the authority.

### 7. Integrate into GitHub safely and finish

1. Inspect the final diff and avoid unrelated changes.
2. Use a dedicated branch and scoped commit(s). Before opening/merging, refresh `main` and reconcile concurrent changes—particularly `.github/workflows/site.yml`—without losing either set of checks.
3. Open a pull request when appropriate, including a description of imported source, changed files, actual verification results, and known gaps. Link any tracking issue.
4. If authorized and checks pass, merge. Confirm the GitHub Actions `deploy` job actually succeeded before claiming the lesson is live. If it has not, report the PR and exact blocking step rather than a guessed deployment status.
5. If GitHub Pages needs one-time settings, confirm or report **Settings → Pages → Build and deployment → Source → GitHub Actions**.
6. Report the final commit/PR link, lesson paths, exact local run commands, tests actually run (with OS), outstanding prerequisites, and confirmed published URL, if any.

**Completion criteria:** The lesson is useful and self-contained; catalog registration is automatic; existing lessons remain intact; actual tests and simulations are distinguished; CI checks and release status are truthfully reported; and the destination has instructions sufficient for the next independent lesson.

---

## Repository-maintainer reminder

The collection's expected mechanism is: a lesson's `lesson.json` → `dotnet run --project tools/Catalog -- build` → generated `_site/index.html` and `_site/catalog.json` → the existing GitHub Actions Pages deployment. No manual homepage edits should be necessary.
