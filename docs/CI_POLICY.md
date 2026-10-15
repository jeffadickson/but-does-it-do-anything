# Opt-in CI and publishing

Ordinary branch pushes, pull-request updates, and merges to `main` do not run the expensive test matrix. The root site and Windows-reader workflows run **only** when an explicit release-candidate tag matching `v*-rc*` is pushed or when you use **Actions → Run workflow**.

Example:

```sh
git tag v1.2.0-rc1
git push origin v1.2.0-rc1
```

This tests the tagged commit. Never move a published RC tag: create `v1.2.0-rc2` for revisions. Release-candidate tag runs **verify** the project; they do not publish Pages. For a Pages release, manually dispatch **Verify and publish lessons** on `main` after merging a tested revision. GitHub Pages must already be configured for GitHub Actions.

.NET 10 runtime packaging is independently available through **Actions → Rebuild and verify .NET 10 browser runner → Run workflow**, which intentionally runs only on explicit request. It publishes a short-lived artifact containing the candidate WASM assets, integrity manifest and regenerated NuGet lockfile. Review these outputs before checking them into a release.

For quick local checks, run `python tools/catalog.py check`, `python tools/catalog.py build` and relevant lesson tests. An untested push must not be described as CI-passing.

**Important:** Branch protections that require CI check names on every PR can block merges under this policy. Configure required checks accordingly. See `docs/NET10_MIGRATION.md` for remaining runtime verification. The Windows viewer produces its downloadable package only when its workflow runs.
