#!/bin/sh
set -eu
cd "$(dirname "$0")"
task="${1:-doctor}"
version="10.0.100"
export DOTNET_ROOT="$PWD/.dotnet"
export PATH="$DOTNET_ROOT:$PATH"
case "$task" in
setup)
  if ! command -v dotnet >/dev/null 2>&1 || ! dotnet --list-sdks | grep -q "^$version "; then
    curl -fsSLo /tmp/instrument-dotnet-install.sh https://dot.net/v1/dotnet-install.sh
    sh /tmp/instrument-dotnet-install.sh --version "$version" --install-dir "$DOTNET_ROOT"
  fi
  dotnet restore tests/InstrumentLab.Tests/InstrumentLab.Tests.csproj ;;
doctor) command -v dotnet || { echo 'Missing .NET 10 SDK: run sh setup.sh setup'; exit 1; }; dotnet --info ;;
build) dotnet build tests/InstrumentLab.Tests/InstrumentLab.Tests.csproj --configuration Release ;;
test-unit) dotnet test tests/InstrumentLab.Tests/InstrumentLab.Tests.csproj --filter FullyQualifiedName~WorkflowTests ;;
test) dotnet test tests/InstrumentLab.Tests/InstrumentLab.Tests.csproj ;;
preview) cd app; python3 -m http.server 8001 --bind 127.0.0.1 ;;
clean) find src tests -type d \( -name bin -o -name obj \) -prune -exec rm -rf {} + ;;
*) echo 'Choose setup|doctor|build|test-unit|test|preview|clean'; exit 2 ;;
esac
