# Prompt for importing another project's educational material

Copy the following into the project's development conversation. Replace the bracketed fields.

---

Bring the educational lesson/demo from this project into:
https://github.com/jeffadickson/but-does-it-do-anything

Lesson title: [TITLE]
Topic: [software-design | software-testing | languages-and-verification | hardware | mathematics]
Lesson slug: [lowercase-hyphenated-slug]
Source material: [current project, paths, repository, release, or attached archive]

Do the work, not just propose a structure:

1. Inspect the destination repository, README.md, CONTRIBUTING.md and any applicable AGENTS.md. Use its current conventions. Inspect the source material and identify what actually runs and what is merely illustrated.
2. Import the educational app into lessons/<topic>/<slug>/app/. Put supporting tutorial source, downloadable example source, tests and source assets in the appropriate sibling directories. Keep substantial product development in its original repository. Do not copy git metadata, secrets, build caches or unrelated binaries.
3. Create or update lesson.json using the repository's existing schema. Include the title, useful summary, topic, prerequisites, tags, languages, level, entrypoint and truthful execution mode. Do not manually edit the generated homepage or generated catalog.
4. Preserve working interactions, language choices, editable examples and downloads. Make asset and navigation URLs work under a GitHub Pages project subpath. Add a clear link back to the collection. Keep server credentials outside browser code. Browser-incompatible tools need a clearly labeled simulation, a runnable local companion, or an external backend.
5. Strengthen the tutorial: concrete problem → straightforward solution → realistic change/pressure → improved design → experiment → specific benefit, cost and when to skip it. Explain what each test proves and does not prove. Use primary references.
6. Document provenance and the exact source revision/release, licenses, prerequisites, build commands, test commands and known limitations in the lesson README. Pin required runtimes and dependencies. Preserve third-party notices. Do not depend on a private chat/site URL for required runtime assets.
7. Add only the CI steps needed for this lesson. Run its meaningful checks plus the collection's tests, metadata validation and build. Do not claim a framework, Docker container, database or physical instrument actually ran unless it did. Report browser verification limits.
8. Commit and push the scoped import if permitted by repository rules; otherwise open a pull request. Preserve concurrent/unrelated work. Do not modify or redeploy the original source project unless explicitly requested.
9. Report the changed paths, checks, commit/PR, and the published lesson URL only after deployment succeeds. If Pages needs configuration, identify the exact missing setting. The top-level homepage should pick up the lesson automatically from lesson.json.

Complete the import and resolve defects found during validation. Ask only when missing source/access or a genuinely consequential choice blocks progress.
