# Hosting and homepage updates

## What GitHub Pages does

Pages serves static files: HTML, CSS, JavaScript, WASM runtimes and downloads. Browser execution (including Python/Ruby/.NET runtimes compiled to WASM, or F# compiled to JS) happens on the visitor's computer. A simulation can also be static but must say what is being modeled.

Pages does not host an always-running .NET/Python service, SQL server, Docker/Testcontainers daemon, or USB/VISA instrument service. Provide native download instructions or a separately hosted backend for those experiences. GitHub Actions can build/test such software during CI, but a CI runner is not the site's interactive backend.

## One-time activation

1. Open https://github.com/jeffadickson/but-does-it-do-anything/settings/pages
2. Under Build and deployment, choose Source: GitHub Actions.
3. Open Actions → Verify and publish lessons → Run workflow on main.
4. Wait for deploy to succeed; use the URL reported by the github-pages environment.

The workflow checks whether Pages is configured before deploying. No personal token is required for normal publication after setup. Changing Pages settings itself requires repository administration access; the connector used for initial scaffolding did not expose that setting.

## Updating the top-level HTML

- New or changed lesson card: edit that lesson's lesson.json. Discovery is automatic.
- Title, tagline or intro: edit site/config.json.
- Homepage sections/layout: edit site/index.template.html.
- Visual design: edit shared/styles/site.css.
- Search/filter behavior: edit shared/components/catalog.js.
- Generated result: `_site/index.html`; do not edit it directly.

Run `python tools/catalog.py build` to regenerate locally. Push to main to regenerate and publish through Actions. A pull request builds and verifies without publishing. The generated catalog is `_site/catalog.json`.

## Path and asset rules

Only shared/ and each lesson's app/ directory enter the published artifact. App files are copied to lessons/<topic>/<slug>/ with their relative structure intact. Use relative URLs, not `/assets/...` URLs that assume a domain root. Keep individual files below GitHub's file limits and the site within Pages limits. Large runtime archives should use pinned, checksum-verified artifacts or reproducible builds; never add tokens to download URLs committed to Git.

## Official references

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
