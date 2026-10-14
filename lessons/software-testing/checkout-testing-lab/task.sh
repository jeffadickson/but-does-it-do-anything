#!/usr/bin/env sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
command="${1:-doctor}"
case "$command" in
 setup) exec sh ./setup.sh ;;
 doctor)
   command -v dotnet >/dev/null 2>&1 || { echo "Missing .NET SDK 8; run ./setup.sh" >&2; exit 1; }
   dotnet --version
   command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 && echo "Docker available" || echo "Docker unavailable: required for integration tests"
   ;;
 build) dotnet build tests/Checkout.Tests/Checkout.Tests.csproj ;;
 test) dotnet test tests/Checkout.Tests/Checkout.Tests.csproj --filter 'FullyQualifiedName!~CombinedCheckoutIntegrationTests' ;;
 integration) dotnet test tests/Checkout.Tests/Checkout.Tests.csproj --filter 'FullyQualifiedName~CombinedCheckoutIntegrationTests' ;;
 preview)
   if command -v python3 >/dev/null 2>&1; then exec python3 -m http.server 8000 -d app --bind 127.0.0.1; fi
   if command -v python >/dev/null 2>&1; then exec python -m http.server 8000 -d app --bind 127.0.0.1; fi
   echo "Python 3 is required for preview" >&2; exit 1 ;;
 clean) dotnet clean tests/Checkout.Tests/Checkout.Tests.csproj ;;
 *) echo "Usage: ./task.sh {setup|doctor|build|test|integration|preview|clean}" >&2; exit 2 ;;
esac
