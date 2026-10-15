#!/usr/bin/env python3
"""Build the actual Parlot Blazor WebAssembly playground for static hosting."""
from pathlib import Path
import subprocess, shutil
root=Path(__file__).resolve().parent
project=root/"wasm/ParlotAdventure.Wasm.csproj"
subprocess.run(["dotnet","publish",str(project),"-c","Release","-o",str(root/"wasm/.publish")],check=True)
source=root/"wasm/.publish/wwwroot"
if not source.is_dir():raise RuntimeError("Publish output missing wwwroot")
destination=root/"app/parlot"
if destination.exists():shutil.rmtree(destination)
shutil.copytree(source,destination)
print("Published actual Parlot WASM into",destination)
