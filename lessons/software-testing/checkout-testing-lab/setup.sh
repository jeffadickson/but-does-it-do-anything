#!/usr/bin/env sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
if ! command -v dotnet >/dev/null 2>&1 || ! dotnet --list-sdks 2>/dev/null | grep -q '^8\.'; then
  echo "Installing .NET SDK 10 to $DOTNET_ROOT from Microsoft's dot.net distribution"
  temp="${TMPDIR:-/tmp}/checkout-dotnet-install-$$.sh"
  trap 'rm -f "$temp"' EXIT HUP INT TERM
  if command -v curl >/dev/null 2>&1; then curl -fLsS https://dot.net/v1/dotnet-install.sh -o "$temp"
  elif command -v wget >/dev/null 2>&1; then wget -q https://dot.net/v1/dotnet-install.sh -O "$temp"
  else echo "Install curl or wget" >&2; exit 1; fi
  sh "$temp" --channel 10.0 --install-dir "$DOTNET_ROOT" --no-path
fi
export PATH="$DOTNET_ROOT:$PATH"
dotnet restore tests/Checkout.Tests/Checkout.Tests.csproj
echo "Setup complete. Run ./task.sh test. Docker (opt-in) required for ./task.sh integration."
