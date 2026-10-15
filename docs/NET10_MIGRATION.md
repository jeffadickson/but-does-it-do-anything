# .NET 10 migration status

Date: 2026-10-15. This branch retargets tracked lesson C# project TFMs and SDK setup/CI pins from .NET 8 to .NET 10.

## Source migration
- Java Futures and async tests: net10.0; SDK 10.0.100; async setup release-metadata channel 10.0.
- Checkout lab: net10.0; SDK 10.0.100; shell and PowerShell bootstrap channel 10.0.
- Instrument lab: net10.0; SDK 10.0.100; shell and PowerShell installer pins.
- Root site CI: setup-dotnet 10.0.100 for source compilation and test runs.

## Explicitly unverified / required before merge
1. Restore the Java Futures tests under .NET 10 with locked mode, regenerate and commit packages.lock.json if NuGet dependency resolution differs. Its framework group was retargeted mechanically; package hashes are not independently verified for .NET 10.
2. Build and run all C# tests on supported operating systems. This environment has no .NET executable and cannot fetch the SDK from github.com.
3. The Java Futures browser Roslyn/.NET WebAssembly runtime is prebuilt and remains at its original runtime version until rebuilt. Source TFM changes alone do not upgrade it. Track its binary assets, checksums, runner assembly, Playwright tests, offline viewer packaging.
4. The separate draft branch `lesson/dsl-adventures-parlot` already carries a .NET 10 upgrade. When integrating, ensure no older .NET 8 project configuration is reintroduced.
5. Check documentation that describes *historical .NET 8 behavior* separately from commands that install or target a current SDK. Historical examples should not be rewritten as if they happened on .NET 10.

CI remains opt-in on branches where the release-candidate policy is adopted. Run manual/RC verification before declaring a supported .NET 10 release.
