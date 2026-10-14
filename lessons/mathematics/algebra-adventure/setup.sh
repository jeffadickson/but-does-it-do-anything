#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
version=$(cat "$root/tools/node-version.txt")
case $(uname -s) in Linux) os=linux;; Darwin) os=darwin;; *) echo 'Use setup.ps1 on Windows. Supported shell systems: macOS, glibc Linux.' >&2; exit 1;; esac
case $(uname -m) in x86_64|amd64) arch=x64;; arm64|aarch64) arch=arm64;; *) echo 'Supported architectures: x64 and arm64.' >&2; exit 1;; esac
local_dir="$root/.tools/node-v$version-$os-$arch"
node="$local_dir/bin/node"
if command -v node >/dev/null 2>&1 && [ "$(node --version)" = "v$version" ]; then node=$(command -v node); fi
if [ ! -x "$node" ]; then
 for tool in curl tar awk; do command -v "$tool" >/dev/null 2>&1 || { echo "Install $tool using your OS package manager, then rerun this command." >&2; exit 1; }; done
 if command -v sha256sum >/dev/null 2>&1; then hasher=sha256sum; elif command -v shasum >/dev/null 2>&1; then hasher=shasum; else echo 'Install sha256sum or shasum, then retry.' >&2; exit 1; fi
 mkdir -p "$root/.tools"
 temp=$(mktemp -d "$root/.tools/download.XXXXXX")
 trap 'rm -rf "$temp"' EXIT HUP INT TERM
 archive="node-v$version-$os-$arch.tar.gz"
 expected=$(awk -v name="$archive" '$2 == name {print $1}' "$root/tools/node-SHASUMS256.txt")
 [ ${#expected} -eq 64 ] || { echo "No pinned checksum for $archive" >&2; exit 1; }
 curl --silent --show-error --fail --location --retry 2 --connect-timeout 20 "https://nodejs.org/dist/v$version/$archive" -o "$temp/$archive" || { echo 'Download blocked. Allow HTTPS to nodejs.org and rerun, or install the exact Node version from its official distribution.' >&2; exit 1; }
 if [ "$hasher" = sha256sum ]; then actual=$(sha256sum "$temp/$archive" | awk '{print $1}'); else actual=$(shasum -a 256 "$temp/$archive" | awk '{print $1}'); fi
 [ "$actual" = "$expected" ] || { echo 'Checksum mismatch; refusing to install.' >&2; exit 1; }
 tar --no-same-owner -xzf "$temp/$archive" -C "$temp"
 mv "$temp/node-v$version-$os-$arch" "$local_dir"
fi
"$node" "$root/task.cjs" "${1:-setup}"
