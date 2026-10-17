# CI run policy — deliberate release-candidate verification

The full GitHub Actions workflows `.github/workflows/site.yml` and `.github/workflows/windows-reader.yml` is **not** triggered by ordinary pushes to feature branches or `main`, by updating a pull request, or by merging a PR.

## When the full suite runs

1. Push a release-candidate tag matching `v*-rc*`, for example:

   ```sh
   git fetch origin
   git checkout main
   git pull --ff-only
   git tag v1.2.0-rc1
   git push origin v1.2.0-rc1
   ```

   The tag points to the exact commit that the matrix tests. Make the next release candidate `v1.2.0-rc2` rather than moving a published tag.

2. Manually request full verification from **Actions → Verify and publish lessons → Run workflow**, choosing the target branch. GitHub requires the workflow to exist on the default branch to expose the manual-run UI.

The Windows reader uses the same RC tag trigger, or can be run on demand through **Actions → Windows reader → Run workflow**.

## Local quick verification

```sh
python tools/catalog.py check
python tools/catalog.py build
python -m unittest discover -s tests -v
node --test shared/components/csharp-runner.test.cjs
```

Run relevant per-lesson tests only when changing that area. This policy trades fast automated feedback for fewer automatic runs. Never treat an untested commit as CI-verified.

## Publishing the website

**Merging no longer automatically deploys GitHub Pages.** After merging a tested revision into `main`, manually start **Verify and publish lessons** on `main`. The existing workflow's Pages detection/deployment logic only allows a main-branch non-PR run to deploy; release-candidate tag runs are verification-only. If Pages is not configured, the deployment remains skipped.

## Safety notes

- Avoid making passing CI checks mandatory branch-protection requirements for every PR unless you intend to invoke the workflow manually before merging; otherwise PRs may remain blocked waiting for a check that is intentionally never started.
- Standard GitHub-hosted Actions runners are free for public repositories under GitHub's current pricing, while larger runners or storage may still incur charges. Inspect actual billing rather than assuming each run costs money.
- The Windows offline reader workflow follows the same release-candidate/manual triggers. Its packaging artifact is still produced only when that workflow runs. Other newly added workflows must be reviewed separately.
- To restore continuous CI, add `pull_request:` and/or `push.branches: [main]` to that workflow in a deliberate change.
