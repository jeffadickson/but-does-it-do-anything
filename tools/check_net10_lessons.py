#!/usr/bin/env python3
"""Verify tracked lesson .NET projects and SDK pins consistently require .NET 10.

This is a source audit, not evidence that prebuilt WebAssembly binaries were rebuilt.
Run: python tools/check_net10_lessons.py
"""
from pathlib import Path
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "lessons"


def check() -> list[str]:
    errors: list[str] = []
    projects = sorted(LESSONS.rglob("*.csproj"))
    if not projects:
        return ["No lesson C# projects found"]
    for project in projects:
        try:
            xml = ET.parse(project)
            targets = []
            for name in ("TargetFramework", "TargetFrameworks"):
                for item in xml.iter(name):
                    targets.extend((item.text or "").split(";"))
            if not targets:
                errors.append(f"{project.relative_to(ROOT)}: missing TargetFramework")
            for target in targets:
                if target.strip() != "net10.0":
                    errors.append(f"{project.relative_to(ROOT)}: non-.NET-10 target {target!r}")
        except ET.ParseError as exc:
            errors.append(f"{project.relative_to(ROOT)}: invalid XML: {exc}")
    for pin in sorted(LESSONS.rglob("global.json")):
        try:
            version = json.loads(pin.read_text(encoding="utf-8"))["sdk"]["version"]
            if not re.fullmatch(r"10\.\d+\.\d+", version):
                errors.append(f"{pin.relative_to(ROOT)}: SDK {version} is not .NET 10")
        except (ValueError, KeyError, TypeError) as exc:
            errors.append(f"{pin.relative_to(ROOT)}: invalid SDK version pin: {exc}")
    return errors


def main() -> int:
    errors = check()
    if errors:
        for error in errors:
            print("ERROR:", error, file=sys.stderr)
        return 1
    projects = len(list(LESSONS.rglob("*.csproj")))
    pins = len(list(LESSONS.rglob("global.json")))
    print(f"Validated {projects} lesson C# projects and {pins} SDK pins: .NET 10 source-only compliance.")
    print("NOTE: Bundled WebAssembly binaries require a separate rebuild and browser verification.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
