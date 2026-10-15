# Invent a Language: Adventures, Turtles, Parlot

Version **0.1.0** — 2026-10-15. Browser gameplay is a **real JavaScript interpreter**, not a Parlot or .NET WASM execution. Real Parlot source is in `examples/ParlotDsl` and requires a .NET SDK and first-time NuGet restore. Open `app/index.html` offline for the two browser steppers, or `python tools/catalog.py serve` from repository root.

Project issue #9 tracks true Parlot-in-browser integration, native compilation/verification, accessibility and full release review. Avoid triggering costly full CI on each push; prefer the release candidate/manual policy.
