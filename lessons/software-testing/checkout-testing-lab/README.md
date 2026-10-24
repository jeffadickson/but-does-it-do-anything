# Checkout Testing Lab

An educational bookstore checkout example illustrating **xUnit**, **NSubstitute**, **WireMock.Net**, and **Testcontainers/PostgreSQL**. The primary experience is an **interactive JavaScript simulation**, not real .NET execution in GitHub Pages. The companion C# project includes actual test code.

## What to learn

A pure mock-based test is fast but cannot verify real HTTP request serialization or actual SQL. This lab begins with a $39.98 order, adds an HTTP payment fake and a disposable PostgreSQL database, and demonstrates how a payment can be approved before a database failure. The test exposes a consistency gap without solving it.

## Paths

- `app/index.html`: standalone browser simulation with injected faults and model assertions.
- `app/tutorial.html`: in-depth explanation and primary references.
- `examples/Checkout.Core/`: .NET checkout implementation (educational example).
- `tests/Checkout.Tests/`: xUnit tests, including combined WireMock/PostgreSQL scenarios.
- `tests/browser-model.test.cjs`: Node built-in test runner verifies browser simulation's cases and faults.

## Quick start

Open `app/index.html` directly; no tools are needed to use the simulator.

For the C# examples (Windows PowerShell):

```powershell
./setup.ps1
./task.ps1 doctor
./task.ps1 build
./task.ps1 test
./task.ps1 integration
./task.ps1 preview
```

For macOS/Linux:

```sh
sh ./setup.sh
sh ./task.sh doctor
sh ./task.sh build
sh ./task.sh test
sh ./task.sh integration
sh ./task.sh preview
```

Visit http://127.0.0.1:8000/ when preview is running. `integration` requires Docker or a compatible container engine already running; setup does **not** install or start one automatically.

`test` runs fast unit tests; `integration` runs the three real HTTP/PostgreSQL combined tests; `node --test tests/browser-model.test.cjs` tests the static simulator.

## Platform and tooling

Target framework .NET 10; `global.json` selects SDK 10.0.100 with patch roll-forward. The native .NET CLI and NuGet restore are the build system; there is no need for Make. Setup uses Microsoft dotnet-install (user-local install) when SDK 10 is missing. Existing PATH/toolchains are not intentionally modified; shell PATH is updated inside setup's process only. If dotnet is not globally installed, invoke scripts after adding `$HOME/.dotnet` to PATH or opening a shell with that directory on PATH. Windows installs to `$HOME/.dotnet` similarly.

PackageReference versions are fixed in the two csproj files; a NuGet dependency lockfile has **not** been generated or verified yet. Dependencies still require access to NuGet on first restore. The PostgreSQL image uses `postgres:16-alpine` (not immutable digest pinned). A clean reproducible release should commit NuGet lockfiles and pin the container digest.

## Safety and limitations

WireMock.Net uses a local HTTP listener. Testcontainers starts ephemeral PostgreSQL with a fixed **test-only** password. Do not use the example credentials outside tests. No real payment provider is called. The simplistic service does not implement compensation, idempotency, refunds or durable notification dispatch; the failure test is intended to reveal that deficiency.

## Provenance and license

Imported/adapted from the Checkout Testing Lab generated in this conversation, 2026-10-14; local source archive `Checkout-Testing-Lab.zip`. The source had no Git revision or explicit license notice. This repository does not imply a license to reuse material beyond applicable law. The imported companion source reproduces the educational checkout design rather than importing unrelated software. Third-party frameworks are distributed via NuGet under their own licenses; framework source code is not embedded.

## References

- https://xunit.net/
- https://nsubstitute.github.io/
- https://wiremock.org/dotnet/
- https://dotnet.testcontainers.org/
- https://www.npgsql.org/

## Maintenance

Modify the lesson under this directory, run `node --test tests/browser-model.test.cjs`, `sh ./task.sh test` and (with Docker) `sh ./task.sh integration`. Run the repository's `dotnet run --project tools/Catalog -- check` and `dotnet run --project tools/Catalog -- build` from repository root; the catalog homepage is generated, not edited manually.

Known unverified items: .NET restore/compile, Docker tests, Windows/macOS bootstrap, and live Pages deployment. Do not treat the JavaScript model assertions as evidence these integrations passed.
