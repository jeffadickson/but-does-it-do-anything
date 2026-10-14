# Instrument Testing Lab — four layers of proof

An imported educational sample from the *Instrument Testing Lab* created in the ChatGPT project conversation on 2026-10-14 (no upstream Git revision). The source archive was supplied as `Instrument_Testing_Lab.zip`. The project contains original educational code and no vendored third-party assets. Distribution rights for package dependencies remain governed by their own licenses; no license is asserted for the collection.

## Experiment

Start with a signal generator and power meter. Force RF output off, configure 1 MHz at -20 dBm, enable, query power, retrieve HTTP calibration, store the corrected result, and switch RF off. A mere happy-path assertion misses command-order mistakes, network failures, and invalid SQL.

- **xUnit:** tests and expected outcomes.
- **NSubstitute:** record and verify SCPI interface calls, including `Received.InOrder`; a subsequence does not rule out unexpected extra commands.
- **WireMock.Net:** actual loopback HTTP server under test; programmable responses and recorded requests.
- **Testcontainers:** disposable *real PostgreSQL* container, not an in-memory substitute.

The HTML page is a **deterministic JavaScript simulation**, *not* C# or Docker execution. The companion tests execute under .NET; the database test needs Docker and an image pull. No physical instruments are driven. These software checks are not hardware safety certification.

## Quick start

From this lesson directory:

```sh
sh setup.sh doctor
sh setup.sh setup
sh setup.sh build
sh setup.sh test-unit
sh setup.sh test
sh setup.sh preview
sh setup.sh clean
```

Windows PowerShell: `./setup.ps1 setup`, `./setup.ps1 test-unit`, `./setup.ps1 preview`. The setup scripts use the official .NET installer and local `.dotnet`; Docker is optional and never auto-started. For the hosted lesson, no SDK is necessary.

`test-unit` runs all `WorkflowTests` without Docker. `test` runs PostgreSQL through Testcontainers and needs a running Docker engine, network access for the image, and sufficient disk space. `preview` serves the HTML from a local loopback HTTP server using Python 3; alternatively open `app/index.html` directly. `build` restores and builds the .NET test project; `clean` removes `bin` and `obj` under the lesson only. Dependencies are exact NuGet versions in the project files but a generated NuGet lock file is not yet committed.

This lesson intentionally changes no root-level build tools. CI runs the unit tests on Ubuntu; real PostgreSQL integration checks and Windows/macOS bootstrap require separate validation. The original draft of this demo did not compile-test in its creation environment; do not infer success from the HTML pass/fail display.

### Tool references
- https://xunit.net/
- https://nsubstitute.github.io/help/received-in-order/
- https://dotnet.testcontainers.org/modules/postgres/
- https://wiremock.org/dotnet/
