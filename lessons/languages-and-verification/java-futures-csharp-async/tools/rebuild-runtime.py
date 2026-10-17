#!/usr/bin/env python3
"""Rebuild the bundled Roslyn/.NET 10 browser runtime from source.

Explicitly opt-in: restoring SDK packages and publishing WebAssembly can
download substantial packages. No actions are triggered by this script.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECT = ROOT / "browser-runner" / "PatternRunner.csproj"
OUTPUT = ROOT / ".build" / "runtime-publish"


def dotnet_executable() -> str:
    override = os.environ.get("LESSON_DOTNET")
    if override:
        return override
    local = ROOT / ".tools" / "dotnet" / ("dotnet.exe" if os.name == "nt" else "dotnet")
    if local.is_file():
        return str(local)
    return shutil.which("dotnet") or "dotnet"


def sdk_installation(dotnet: str) -> tuple[str, Path]:
    result = subprocess.run([dotnet, "--list-sdks"], check=True, text=True, capture_output=True)
    matches = []
    for line in result.stdout.splitlines():
        match = re.match(r"\s*(10\.\d+\.\d+)\s+\[(.+)\]\s*$", line)
        if match:
            version = match.group(1)
            sdk_parent = Path(match.group(2)).resolve()
            matches.append((tuple(int(p) for p in version.split(".")), version, sdk_parent.parent))
    if not matches:
        raise RuntimeError(".NET 10 SDK not found; install SDK 10 and retry.")
    _, version, home = max(matches)
    return version, home


def reference_directory(home: Path) -> Path:
    folder = home / "packs" / "Microsoft.NETCore.App.Ref"
    candidates = []
    if folder.is_dir():
        for item in folder.iterdir():
            match = re.fullmatch(r"10\.(\d+)\.(\d+)", item.name)
            ref_dir = item / "ref" / "net10.0"
            if match and ref_dir.is_dir() and list(ref_dir.glob("*.dll")):
                candidates.append(((int(match.group(1)), int(match.group(2))), ref_dir))
    if not candidates:
        raise RuntimeError(f"Missing .NET 10 reference assemblies under {folder}")
    return max(candidates)[1]


def execute(args: list[str]) -> None:
    print("+", " ".join(args), flush=True)
    subprocess.run(args, cwd=ROOT, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--test", action="store_true",
                        help="Also run the lesson's Node + Playwright browser tests")
    args = parser.parse_args()
    dotnet = dotnet_executable()
    try:
        version, home = sdk_installation(dotnet)
        refs = reference_directory(home)
        print(f"Using .NET SDK {version} and reference pack {refs}")
        OUTPUT.mkdir(parents=True, exist_ok=True)
        execute([dotnet, "publish", str(PROJECT), "-c", "Release", "-o", str(OUTPUT)])
        website = OUTPUT / "wwwroot"
        if not (website / "_framework").is_dir():
            raise RuntimeError(f"Expected published _framework missing at {website}")
        execute([sys.executable, str(ROOT / "tools" / "package_runtime.py"),
                 str(website), "--reference-dir", str(refs)])
        node = shutil.which("node")
        if not node:
            raise RuntimeError("Node.js is required to verify the rebuilt runtime")
        execute([node, "tools/verify-runtime.cjs"])
        execute([node, "build.cjs"])
        if args.test:
            execute([node, "task.cjs", "test"])
        print("Rebuilt runtime and SHA256 manifest with .NET 10. Review and commit")
        print("app/csharp-runtime/, app/csharp-refs/ and browser-runner/runtime-sha256.json.")
        return 0
    except (FileNotFoundError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"Runtime rebuild failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
