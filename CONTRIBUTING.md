# Contributing lessons

1. Inspect this repository and any existing lesson before editing. Preserve unrelated work.
2. Use `dotnet run --project tools/Catalog -- new <topic> <slug> --title "..."` or import into the same structure. Metadata is `lesson.json`, not YAML.
3. Required fields: id, title, summary, topic, level, mode, languages, tags, prerequisites, entrypoint. ID is lowercase with hyphens and unique across the collection. Topic and ID must match the directory. Entrypoint is a relative HTML path under app/.
4. Topics: software-design, software-testing, languages-and-verification, hardware, mathematics.
5. Execution modes: browser (actual code executes locally), simulation (conceptual model), local-tools (installation needed), hosted (external backend needed). Describe mixed modes precisely in the lesson and use the mode representing the primary experience. Never label simulated framework output as an actual tool execution.
6. Explain the concrete problem, the reasonable initial solution, the change that exposes a limitation, the improved design, a runnable experiment, and the benefit/cost/when-to-skip decision. State what test evidence establishes and what it does not.
7. Preserve language selection, editable code, downloads and tests during imports where they already exist. Do not flatten a working app into screenshots.
8. Only app/ is published. Keep credentials, databases, build caches, and development files outside it. Use relative asset URLs so `/but-does-it-do-anything/` works. Include a link back to `../../../index.html` from a standard lesson index.
9. Keep a small standalone lesson independent of unrelated compiler toolchains. Pin larger dependencies. Bundle required runtime files or download exact versions with checksums during an explicit CI build step; do not silently depend on a private Site URL or an unversioned CDN.
10. Preserve licenses and record source repository/revision in the lesson README. Large videos, SDKs, container images, and archives belong in appropriate release or artifact storage; keep stable references and checksums.
11. Document build and check commands. Add necessary per-lesson jobs/steps to CI. Never interpret metadata as shell commands.
12. Run core tests, lesson tests, check and build. Test relative URLs and downloads; report if browser verification is unavailable. Update README and commit/PR only the intended files.

An import should not change the existing source project or its deployment unless separately requested. The collection uses copies of educational source or pinned release references, not bidirectional automatic synchronization.
