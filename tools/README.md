# Repository tools

Requires the .NET 10 SDK. No external NuGet packages are required. Commands work on Windows, macOS and Linux; run from repository root:

```sh
dotnet run --project tools/Catalog -- check
dotnet run --project tools/Catalog -- build
dotnet run --project tools/Catalog -- serve --port 8000
dotnet run --project tools/Catalog -- new mathematics balance --title "Balance an equation"
dotnet run --project tools/Catalog -- check-net10
dotnet run --project tests/Catalog.Tests
```

The server binds to loopback and rebuilds once at startup. Stop and restart after changes. The audit checks lesson source projects and SDK pins; it does not rebuild bundled WebAssembly.

`tools.json` provides descriptive tags and command discovery for both tools. The annotated Git tag `tools-python-baseline` preserves the original Python implementation and its tests before the C# port.
