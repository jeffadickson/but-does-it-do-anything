# Expert review and revision record

Five sequential reviews were requested. An independent AI reviewer acting as an expert Java/C# concurrency programmer inspected each revised version. Findings below record actual changes, not certification by a human reviewer.

## Pass 1 — Correctness and ownership

- Removed inactive Java Future simulator controls left after switching Java to source-only.
- Fixed `Patterns.DifferenceAsync`: async wrappers capture synchronous driver exceptions so WhenAll still drains the already-started sibling. Added a gated NSubstitute regression.
- Clarified cleanup cancellation budgets are cooperative, not forced deadlines; unverified output state remains unsafe.
- Explicitly separated JavaScript countdown cards from actual C# workbench execution.

## Pass 2 — Composition and measurement semantics

- Applied the synchronous-failure wrapper to the chapter 10 two-DMM excerpt; documented the narrower assumption in chapter 7.
- Renamed scope variable from rms to vpp to match its peak-to-peak measurement.
- Registered Java anyOf before dependent waits and observed that race before allOf. Clarified that an untagged result does not identify its producer.

## Pass 3 — Editable browser execution

- Preserve per-preset drafts for the current page session.
- Lock source and scenario during execution so output corresponds to the displayed program.
- Added actual edited-source sentinel execution, draft preservation, compile-error recovery, and Stop/restart browser regressions.

## Pass 4 — Coherent teaching models

- Aligned Java power computation with the dependency graph: calibration must complete before combining with current, yielding 1.001 W.
- Renamed stream chart buffering to display history and explicitly distinguished it from a producer queue/backpressure.
- Documented the native fixtures' fixed latency/reading and ignored configuration values, distinguishing them from the browser workbench.

## Pass 5 — Packaging and final evidence

- Corrected stale all-in-one runtime and no-third-party-script claims. HTML supports standalone reading; real C# requires the separately bundled runtime assets.
- Updated README and verification results with the expanded browser checks and eight passing xUnit tests.
- Added build-time verification of every bundled runtime asset's recorded SHA-256, rejecting missing or altered payloads.

The reviewer reported no remaining blocking concurrency defect in the inspected code. This is scoped review, not proof of correctness. Clean runtime rebuild and wider OS/browser coverage remain unverified and explicitly documented.
