"""Pure-unit tests for the .NET 10 runtime rebuild helper (no SDK/download required)."""
import importlib.util
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

HELPER = Path(__file__).resolve().parents[1] / "tools" / "rebuild-runtime.py"
spec = importlib.util.spec_from_file_location("runtime_rebuild_helper", HELPER)
rebuild = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(rebuild)


class RuntimeRebuildTests(unittest.TestCase):
    def test_selects_newest_net10_sdk_and_ignores_net8(self):
        listing = (
            "8.0.408 [/opt/dotnet/sdk]\n"
            "10.0.100 [/opt/dotnet/sdk]\n"
            "10.0.402 [/opt/dotnet/sdk]\n"
        )
        with mock.patch.object(rebuild.subprocess, "run", return_value=SimpleNamespace(stdout=listing)):
            version, base = rebuild.sdk_installation("dotnet")
        self.assertEqual("10.0.402", version)
        self.assertEqual(Path("/opt/dotnet"), base)

    def test_refuses_net8_only_installation(self):
        with mock.patch.object(rebuild.subprocess, "run", return_value=SimpleNamespace(
            stdout="8.0.408 [/opt/dotnet/sdk]\n"
        )):
            with self.assertRaisesRegex(RuntimeError, ".NET 10 SDK"):
                rebuild.sdk_installation("dotnet")

    def test_finds_latest_net10_ref_pack(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for version in ["10.0.0", "10.0.4", "8.0.15"]:
                directory = root / "packs" / "Microsoft.NETCore.App.Ref" / version / "ref" / ("net8.0" if version.startswith("8") else "net10.0")
                directory.mkdir(parents=True)
                (directory / "System.Runtime.dll").write_bytes(b"test")
            result = rebuild.reference_directory(root)
            self.assertEqual("10.0.4", result.parent.parent.name)

    def test_sdk_parser_supports_windows_paths(self):
        listing = "10.0.100 [C:\\Program Files\\dotnet\\sdk]\\n"
        with mock.patch.object(rebuild.subprocess, "run", return_value=SimpleNamespace(stdout=listing)):
            version, base = rebuild.sdk_installation("dotnet")
        self.assertEqual("10.0.100", version)
        self.assertIn("dotnet", str(base))

    def test_missing_ref_pack_raises(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(RuntimeError, "Missing .NET 10 reference"):
                rebuild.reference_directory(Path(folder))


if __name__ == "__main__":
    unittest.main()
