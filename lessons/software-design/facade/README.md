# Facade maintenance experiment

A self-contained JavaScript conceptual simulation of two instrument procedures after a settling requirement changes. No actual instrument connection or timing occurs. This is a new worked example, not a migration of Pattern Atlas.

From repository root: `python tools/catalog.py serve` then open `/lessons/software-design/facade/`.

Check: `node --test lessons/software-design/facade/tests/*.cjs`.

The duplicated design has one missed policy update. The shared design centralizes policy in a facade function. Both handle cleanup correctly, and injected meter failures affect both. The lesson deliberately avoids claiming that only a facade can use finally or that a facade removes all hardware error handling.
