# Bundled runtime and compiler

This lesson reuses the working .NET 10 WebAssembly / Roslyn 4.14.0 compiler from the Pattern Atlas lesson. Runner source is Program.cs; acquisition source is ../examples/csharp/BrowserLab.cs.txt. SHA-256 hashes identify the supplied binary payloads.

.NET runtime, ASP.NET Core, and Roslyn are Microsoft/.NET Foundation open-source components distributed under MIT terms. See DOTNET-LICENSE.txt, DOTNET-THIRD-PARTY-NOTICES.txt, and upstream notices:

- https://github.com/dotnet/runtime/blob/main/LICENSE.TXT
- https://github.com/dotnet/runtime/blob/main/THIRD-PARTY-NOTICES.TXT
- https://github.com/dotnet/aspnetcore/blob/main/LICENSE.txt
- https://github.com/dotnet/roslyn/blob/main/License.txt

Compiler assembly version: Microsoft.CodeAnalysis.CSharp 4.14.0. Runtime toolchain from the existing deployment: .NET 10.0.13. No runtime download from a CDN is performed by this lesson.
