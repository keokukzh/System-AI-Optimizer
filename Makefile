# OptiAI Production Build System
# Makefile for building and deploying OptiAI

.PHONY: help install build dev test clean release dist ci

# Default target
help:
	@echo "OptiAI Build System"
	@echo "=================="
	@echo ""
	@echo "Available targets:"
	@echo "  install           - Install all dependencies"
	@echo "  dev               - Start development environment"
	@echo "  build             - Build production version"
	@echo "  production-build  - Full production build with all components"
	@echo "  build-backend     - Build Python backend only"
	@echo "  build-llm         - Build LLM components (model + server)"
	@echo "  build-installers  - Build Windows MSI and NSIS installers"
	@echo "  build-msi         - Build MSI installer only"
	@echo "  build-nsis        - Build NSIS installer only"
	@echo "  test              - Run basic tests"
	@echo "  test-all          - Run comprehensive test suite"
	@echo "  test-e2e          - Run end-to-end tests"
	@echo "  test-performance  - Run performance tests"
	@echo "  test-security     - Run security tests"
	@echo "  test-docker       - Run tests with Docker"
	@echo "  test-install      - Install test dependencies"
	@echo "  pre-build         - Run pre-build validation"
	@echo "  optimize-build    - Optimize build for production"
	@echo "  production-build-optimized - Full optimized production build"
	@echo "  final-build       - Final production build with validation"
	@echo "  release-docs      - Create release documentation"
	@echo "  release           - Complete release process"
	@echo "  clean             - Clean build artifacts"
	@echo "  release           - Create release builds for all platforms"
	@echo "  dist              - Create distribution package"
	@echo "  ci                - Run CI pipeline (tests + license check)"
	@echo ""

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd backend && python -m venv .venv
	cd backend && .venv/Scripts/activate && pip install -r requirements.txt
	npm install
	cd src-tauri && cargo build

# Development environment
dev:
	@echo "Starting development environment..."
	@echo "Backend: http://127.0.0.1:5174"
	@echo "Frontend: http://localhost:5175"
	@echo "Tauri: cargo tauri dev"
	@echo ""
	@echo "Run these commands in separate terminals:"
	@echo "1. cd backend && .venv/Scripts/activate && uvicorn main:app --reload --port 5174"
	@echo "2. npm run dev -- --port 5175"
	@echo "3. cargo tauri dev"

# Build production version
build:
	@echo "Building production version..."
	npm run build
	cd src-tauri && cargo tauri build

# Full production build with all components
production-build:
	@echo "Running full production build..."
	python scripts/production_build.py

# Build backend only
build-backend:
	@echo "Building Python backend..."
	cd backend && python embed_python.py

# Build LLM components
build-llm:
	@echo "Building LLM components..."
	python scripts/download_production_model.py
	python scripts/build_llama_server.py

# Build Windows installers
build-installers:
	@echo "Building Windows installers..."
	python scripts/build_installers.py

# Build MSI installer only
build-msi:
	@echo "Building MSI installer..."
	cd src-tauri && cargo tauri build --target x86_64-pc-windows-msvc --bundles msi

# Build NSIS installer only
build-nsis:
	@echo "Building NSIS installer..."
	cd src-tauri && cargo tauri build --target x86_64-pc-windows-msvc --bundles nsis

# Run tests
test:
	@echo "Running tests..."
	cd backend && .venv/Scripts/activate && python -m pytest tests/ -v
	npm test

# Run comprehensive test suite
test-all:
	@echo "Running comprehensive test suite..."
	python scripts/run_tests.py

# Run E2E tests
test-e2e:
	@echo "Running E2E tests..."
	npx playwright test

# Run performance tests
test-performance:
	@echo "Running performance tests..."
	python -m pytest tests/performance/ -v

# Run security tests
test-security:
	@echo "Running security tests..."
	python -m pytest tests/security/ -v

# Run tests with Docker
test-docker:
	@echo "Running tests with Docker..."
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Install test dependencies
test-install:
	@echo "Installing test dependencies..."
	npm install @playwright/test playwright
	npx playwright install
	pip install pytest pytest-cov requests selenium

# Pre-build validation
pre-build:
	@echo "Running pre-build validation..."
	python scripts/pre_build_check.py

# Optimize build
optimize-build:
	@echo "Optimizing build for production..."
	python scripts/optimize_build.py

# Full production build with optimization
production-build-optimized:
	@echo "Running optimized production build..."
	make pre-build
	make optimize-build
	make production-build

# Final production build with documentation
final-build:
	@echo "Running final production build..."
	python scripts/final_production_build.py

# Create release documentation
release-docs:
	@echo "Creating release documentation..."
	python scripts/create_release_docs.py

# Complete release process
release:
	@echo "Running complete release process..."
	make final-build
	make release-docs

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf src-tauri/target/
	rm -rf node_modules/.vite/
	cd backend && rm -rf __pycache__/
	cd backend && rm -rf .pytest_cache/

# Version management
VERSION := $(shell cat VERSION)
BUILD_ID := $(shell git rev-parse --short HEAD 2>/dev/null || echo "dev")
RELEASE_NAME := OptiAI_$(VERSION)_win64

# Create release builds for all platforms
release: clean build
	@echo "Creating release builds for version $(VERSION)..."
	@mkdir -p dist
	@echo "Building Windows MSI installer..."
	cd src-tauri && cargo tauri build --target x86_64-pc-windows-msvc
	@echo "Copying Windows MSI installer..."
	@cp src-tauri/target/release/bundle/msi/*.msi dist/$(RELEASE_NAME).msi || true
	@echo "Copying Windows NSIS installer..."
	@cp src-tauri/target/release/bundle/nsis/*.exe dist/$(RELEASE_NAME).exe || true
	@echo "Creating release notes..."
	@echo "OptiAI $(VERSION) - Build $(BUILD_ID)" > dist/RELEASE_NOTES.txt
	@echo "Release date: $$(date)" >> dist/RELEASE_NOTES.txt
	@echo "Git commit: $$(git rev-parse HEAD 2>/dev/null || echo 'unknown')" >> dist/RELEASE_NOTES.txt
	@echo "Release artifacts created in dist/"

# Sign release artifacts (mock signing for development)
sign: release
	@echo "Signing release artifacts (mock)..."
	@echo "Mock signing completed for $(RELEASE_NAME)"

# Create release archive
archive: release
	@echo "Creating release archive..."
	@cd dist && zip -r $(RELEASE_NAME).zip *.msi *.exe RELEASE_NOTES.txt
	@echo "Release archive created: dist/$(RELEASE_NAME).zip"

# Create distribution package
dist:
	@echo "Creating distribution package..."
	mkdir -p dist/optiai
	cp -r src-tauri/target/release/bundle/msi/*.msi dist/optiai/ 2>/dev/null || true
	cp -r src-tauri/target/release/bundle/dmg/*.dmg dist/optiai/ 2>/dev/null || true
	cp -r src-tauri/target/release/bundle/appimage/*.AppImage dist/optiai/ 2>/dev/null || true
	cp README.md dist/optiai/
	cp LICENSE dist/optiai/
	cp -r docs/ dist/optiai/ 2>/dev/null || true
	cd dist && zip -r optiai-v1.0.0.zip optiai/

# CI pipeline
ci: test
	@echo "Running license check..."
	python scripts/check_licenses.py
	@echo "CI pipeline completed successfully"

# Docker build (optional)
docker-build:
	@echo "Building Docker image..."
	docker build -t optiai:latest .

# Docker run (optional)
docker-run:
	@echo "Running Docker container..."
	docker run -p 5174:5174 -p 5175:5175 optiai:latest

# Update dependencies
update:
	@echo "Updating dependencies..."
	cd backend && .venv/Scripts/activate && pip install --upgrade -r requirements.txt
	npm update
	cd src-tauri && cargo update

# Security audit
audit:
	@echo "Running security audit..."
	cd backend && .venv/Scripts/activate && pip audit
	npm audit
	cd src-tauri && cargo audit

# Format code
format:
	@echo "Formatting code..."
	cd backend && .venv/Scripts/activate && black . && isort .
	npm run format
	cd src-tauri && cargo fmt

# Lint code
lint:
	@echo "Linting code..."
	cd backend && .venv/Scripts/activate && flake8 . && mypy .
	npm run lint
	cd src-tauri && cargo clippy

# Performance test
perf:
	@echo "Running performance tests..."
	cd backend && .venv/Scripts/activate && python -m pytest tests/performance/ -v

# Documentation
docs:
	@echo "Generating documentation..."
	cd backend && .venv/Scripts/activate && sphinx-build -b html docs/ docs/_build/
	npm run docs

# Backup
backup:
	@echo "Creating backup..."
	tar -czf optiai-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz \
		--exclude=node_modules \
		--exclude=backend/.venv \
		--exclude=src-tauri/target \
		--exclude=dist \
		.

# Restore from backup
restore:
	@echo "Restoring from backup..."
	@read -p "Enter backup filename: " backup_file; \
	tar -xzf $$backup_file

# System requirements check
check-requirements:
	@echo "Checking system requirements..."
	@echo "Python: $$(python --version 2>/dev/null || echo 'Not found')"
	@echo "Node.js: $$(node --version 2>/dev/null || echo 'Not found')"
	@echo "Rust: $$(rustc --version 2>/dev/null || echo 'Not found')"
	@echo "Cargo: $$(cargo --version 2>/dev/null || echo 'Not found')"