# DSL Adventures: .NET 10; run make from this directory.
DOTNET ?= dotnet
PYTHON ?= python3
PROJECT := wasm/ParlotAdventure.Wasm.csproj
CLI := examples/ParlotDsl/ParlotDsl.csproj

.PHONY: help doctor setup build test preview clean
help:
	@printf '%s\n' 'make doctor  - inspect installed .NET SDK' 'make setup   - restore both projects' 'make build   - publish real Parlot browser app' 'make test    - compile native CLI and WASM source' 'make preview - build collection and serve locally' 'make clean   - remove generated build outputs'
doctor:
	$(DOTNET) --info
setup:
	$(DOTNET) restore $(PROJECT)
	$(DOTNET) restore $(CLI)
build: setup
	DOTNET=$(DOTNET) $(PYTHON) build_wasm.py
test: setup
	$(DOTNET) build $(CLI) --no-restore -c Release
	$(DOTNET) build $(PROJECT) --no-restore -c Release
preview: build
	$(PYTHON) ../../../tools/catalog.py build
	$(PYTHON) ../../../tools/catalog.py serve
clean:
	$(DOTNET) clean $(PROJECT) -c Release
	$(DOTNET) clean $(CLI) -c Release
	rm -rf wasm/.publish app/parlot
