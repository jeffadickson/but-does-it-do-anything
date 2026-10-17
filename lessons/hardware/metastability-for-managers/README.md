# Metastability for managers — v1.0.0

A 12–15 minute briefing: asynchronous arrival, possible metastability, the purpose of two **receiving-clock** stages, and a short level/event/mailbox/FIFO comparison. Created for this repository using `prompts/generic.md`, based on main `6993af27252fcfbd8d055c2632f5d7c2f3434a78`. Tracking: #14.

## Open

Open `app/index.html` directly in a modern browser. It is a single standalone file with embedded CSS, SVG and JavaScript; no installation, server, SDK or internet needed. External source links and the catalog back link are not standalone offline resources. There are five deterministic teaching scenarios, arrival/time sliders, play/pause/step/reset, and four exercises. No autoplay; reduced-motion readers can use step or scrub.

From the repository root, Python 3.11+ builds the existing catalog:

```sh
python tools/catalog.py check
python tools/catalog.py build
python tools/catalog.py serve
```

Open http://localhost:8000/lessons/hardware/metastability-for-managers/index.html . On Windows use `py -3` if appropriate. Setup/doctor: no dependencies to view; confirm a current browser. Build: catalog command above. Preview: direct file or catalog server. Clean: remove generated `_site/` only, retaining lesson sources.

## Verify

```sh
node --test lessons/hardware/metastability-for-managers/tests/model.test.cjs
python -m unittest discover -s tests -v
```

CI uses Node 22.23.3. Browser checks reuse Playwright 1.51.1 already pinned by the async lesson. After that lesson's `npm ci` and `npx playwright install chromium`, set `NODE_PATH` to its `node_modules` directory and run:

```sh
node lessons/hardware/metastability-for-managers/tests/browser.cjs
```

`BROWSER_EXECUTABLE` optionally selects a browser executable for local testing. Screenshots go into the OS temporary directory. The existing site workflow runs model checks and browser checks; its manual/release-candidate trigger policy is unchanged.

## Model and evidence limits

The JavaScript calculates illustrative states; it does not simulate transistor physics or estimate MTBF. Near-edge outcomes and settling times are injected deterministically. Both synchronizer flip-flops use clock B; FF2 samples the prior FF1 value. A long-resolution example explicitly permits FF2 metastability. An old-value case demonstrates delayed recognition, and a brief pulse is lost without any metastability.

`OUTLINE_AND_REVIEWS.md` records design passes, source review and actual verification. Model tests and catalog tests passed on Linux / Node 24.19.0 / Python 3.12.14. Local Chromium execution was blocked by this environment's socket restrictions; browser tests are provided and wired into CI, but rendering, interaction, mobile and OS-specific behavior have not been verified in a real browser in this session. Do not interpret static inspection as a browser pass.

## Provenance and version

Original lesson text, SVG and deterministic teaching model generated with AI assistance; primary technical references are linked in the HTML. No third-party assets or physics constants are bundled. Collection licensing policy applies. Keep version in metadata, visible HTML, README and changelog consistent (checked by tests). Only `app/` is published. This branch/PR does not itself publish or merge the lesson.
