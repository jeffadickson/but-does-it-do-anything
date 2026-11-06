# Repository instructions

These instructions apply throughout this repository. See CONTRIBUTING.md for lesson conventions and docs/requirements.sdoc for stable policy requirement IDs.

## Languages and automation

- Prefer C# or F# for scripts, automation, and tooling wherever practical. Prefer C# file-based apps or F# Interactive for small scripts. Do not default to Python.
- Use another language when explicitly requested or when an existing toolchain, required workflow, browser runtime, or lesson subject requires it. Explain the exception in the script documentation or pull request.
- Use PowerShell and native PowerShell cmdlets for shell commands and text/file operations by default.

## Reproducible scripts

- Commit all scripts created or used to implement, generate, migrate, build, test, validate, or maintain a change, including one-off scripts. Keep repository-wide scripts under tools/ or tests/ and lesson-specific scripts with their lesson.
- If a script was initially written in a temporary directory or outside the repository, bring its reusable source into the repository before completing the change. Document its purpose, prerequisites, exact invocation, inputs, and outputs. Reference existing committed scripts rather than duplicating them.
- Record material interactive commands and their results in the pull request or verification notes. Do not commit credentials, private input data, caches, dependencies, or generated build artifacts merely because a script used them. Redact secrets from committed script sources and accept them through documented configuration.

## Requirements, code, and verification

- Maintain software requirements in StrictDoc with stable requirement IDs and traceability to implementation and verification evidence.
- Comment public interfaces, intent, assumptions, invariants, numerical conventions, and non-obvious logic meaningfully; keep comments accurate and avoid restating code.
- For code changes, collect and report line and branch coverage where supported. Identify unmeasured areas and tooling limitations; never invent results or treat coverage as proof of correctness.
- Include relevant mutation testing, malformed-input and negative tests, input fuzzing, and randomized/property-based testing. Retain reproducible seeds and minimized counterexamples, and report which methods ran and any limitations.
- Prefer Pester for PowerShell tests, FsCheck for .NET property-based tests, cargo-nextest for Rust tests, Apache Arrow .NET for columnar results, and DuckDB for querying Parquet when applicable.
