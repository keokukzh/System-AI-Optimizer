# OptiAI Production Build Guide

This guide covers the complete production build process for OptiAI, including backend bundling, LLM integration, and desktop application packaging.

## Overview

OptiAI uses a multi-stage production build process that creates a fully self-contained desktop application with:

- **Bundled Python Backend**: FastAPI server packaged as a standalone executable
- **Local LLM Integration**: Lightweight AI model with llama.cpp server
- **Tauri Desktop App**: Cross-platform native desktop wrapper
- **Optimized Frontend**: React application with production optimizations

## Prerequisites

### Required Tools

- **Python 3.9+** with pip
- **Node.js 18+** with npm
- **Rust 1.70+** with Cargo
- **Git** for version control
- **CMake 3.20+** for building llama.cpp
- **Visual Studio Build Tools** (Windows) or **Xcode Command Line Tools** (macOS)

### System Requirements

- **Windows 10/11** (primary target)
- **macOS 10.15+** (secondary support)
- **Linux** (Ubuntu 20.04+) (tertiary support)
- **8GB RAM** minimum (16GB recommended for LLM)
- **2GB free disk space** for build artifacts

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/optiai.git
cd optiai
make install
```

### 2. Full Production Build

```bash
make production-build
```

This single command will:
- Clean all build artifacts
- Install dependencies
- Bundle the Python backend
- Download and setup the LLM model
- Build the llama.cpp server
- Build the frontend
- Create the Tauri desktop app
- Package release artifacts

### 3. Verify Build

```bash
ls -la dist/
```

You should see:
- `OptiAI_1.0.0_win64.msi` - Windows installer
- `OptiAI_1.0.0_win64.exe` - NSIS installer
- `checksums.txt` - File integrity checksums
- `build_report.json` - Build details and metadata

## Detailed Build Process

### Phase 0: Pre-Build Cleanup

```bash
# Clean all build artifacts
make clean

# Remove Python cache
find . -name "__pycache__" -type d -exec rm -rf {} +
find . -name "*.pyc" -delete

# Remove Node.js cache
rm -rf node_modules/.vite
rm -rf node_modules/.cache
```

### Phase 1: Backend Python Bundling

The Python backend is bundled using PyInstaller to create a standalone executable:

```bash
# Build backend executable
make build-backend

# This creates: src-tauri/sidecars/backend-server.exe
```

**Key Features:**
- Single executable file (no Python installation required)
- Includes all dependencies
- FastAPI server with uvicorn
- Policy validation and security features
- Auto-start with Tauri application

### Phase 2: LLM Integration

Local AI capabilities are provided through a lightweight LLM model:

```bash
# Download and setup LLM model
make build-llm

# This creates:
# - src-tauri/resources/models/phi-2-q4_k_m.gguf (quantized model)
# - src-tauri/resources/models/model-config.json (configuration)
# - src-tauri/sidecars/llama-server.exe (server executable)
```

**Model Specifications:**
- **Model**: Microsoft Phi-2 (quantized to Q4_K_M)
- **Size**: ~1.6GB (optimized for desktop)
- **Context**: 2048 tokens
- **Performance**: ~10-20 tokens/second on modern hardware
- **Fallback**: Rule-based suggestions if LLM unavailable

### Phase 3: Frontend Build

The React frontend is built with production optimizations:

```bash
npm run build
```

**Optimizations Applied:**
- Code splitting and lazy loading
- Tree shaking for minimal bundle size
- Asset optimization and compression
- Environment variable injection
- Source map generation for debugging

### Phase 4: Tauri Desktop App

The desktop application is built using Tauri:

```bash
cd src-tauri && cargo tauri build
```

**Features:**
- Native desktop performance
- System tray integration
- Auto-updater support
- Admin rights for system operations
- Cross-platform compatibility

## Build Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Backend Configuration
VITE_BACKEND_URL=http://127.0.0.1:5174
VITE_LLM_SERVER_URL=http://127.0.0.1:11435

# Build Configuration
VITE_APP_VERSION=1.0.0
VITE_BUILD_DATE=2024-01-15
VITE_GIT_COMMIT=abc1234

# LLM Configuration
LLM_MODEL_NAME=microsoft/phi-2
LLM_QUANTIZATION=q4_k_m
LLM_CONTEXT_SIZE=2048
LLM_TEMPERATURE=0.7
```

### Tauri Configuration

The `src-tauri/tauri.conf.json` includes:

```json
{
  "externalBin": [
    "sidecars/llama-server.exe",
    "sidecars/backend-server.exe"
  ],
  "bundle": {
    "identifier": "com.optiai.app",
    "category": "Utility",
    "shortDescription": "AI-powered system optimizer",
    "longDescription": "OptiAI is an intelligent desktop application that analyzes your system and provides AI-powered optimization suggestions."
  }
}
```

## Build Scripts

### Production Build Script

The main build orchestrator is `scripts/production_build.py`:

```python
# Key features:
- Prerequisite checking
- Dependency installation
- Backend bundling
- LLM setup
- Frontend build
- Tauri packaging
- Artifact verification
- Checksum generation
- Build reporting
```

### Individual Build Scripts

- `scripts/download_production_model.py` - LLM model download and quantization
- `scripts/build_llama_server.py` - llama.cpp server compilation
- `backend/embed_python.py` - Python backend bundling
- `backend/startup.py` - Backend server management

## Troubleshooting

### Common Issues

#### 1. Python Backend Build Fails

```bash
# Check Python version
python --version  # Should be 3.9+

# Check PyInstaller
pip install pyinstaller

# Check dependencies
cd backend && pip install -r requirements.txt
```

#### 2. LLM Model Download Fails

```bash
# Check internet connection
# Verify Hugging Face access
# Check disk space (need ~2GB)

# Manual download
python scripts/download_production_model.py --verbose
```

#### 3. llama.cpp Build Fails

```bash
# Check CMake
cmake --version  # Should be 3.20+

# Check Visual Studio Build Tools (Windows)
# Check Xcode Command Line Tools (macOS)

# Manual build
python scripts/build_llama_server.py --verbose
```

#### 4. Tauri Build Fails

```bash
# Check Rust
rustc --version  # Should be 1.70+

# Check Cargo
cargo --version

# Clean and rebuild
cd src-tauri && cargo clean && cargo tauri build
```

### Build Logs

All build operations are logged to `build.log`:

```bash
# View build log
tail -f build.log

# Search for errors
grep -i error build.log

# Check specific phase
grep -i "backend" build.log
```

### Performance Optimization

#### Build Time Optimization

```bash
# Use parallel builds
export CARGO_BUILD_JOBS=4
export CMAKE_BUILD_PARALLEL_LEVEL=4

# Use ccache for C++ compilation
export CCACHE_DIR=/tmp/ccache
```

#### Memory Optimization

```bash
# Limit memory usage during build
export NODE_OPTIONS="--max-old-space-size=4096"
export CARGO_BUILD_JOBS=2
```

## Release Process

### 1. Version Management

```bash
# Update version in package.json and Cargo.toml
npm version patch  # or minor, major

# Tag the release
git tag v1.0.0
git push origin v1.0.0
```

### 2. Build Release

```bash
# Full production build
make production-build

# Verify artifacts
ls -la dist/
cat dist/checksums.txt
```

### 3. Testing

```bash
# Test on clean Windows VM
# Verify all features work
# Check system requirements
# Test installation process
```

### 4. Distribution

```bash
# Upload to GitHub Releases
# Create release notes
# Update documentation
# Notify users
```

## Security Considerations

### Code Signing

For production releases, code signing is recommended:

```bash
# Windows (requires certificate)
signtool sign /f certificate.pfx /p password OptiAI.exe

# macOS (requires Apple Developer account)
codesign --sign "Developer ID Application: Your Name" OptiAI.app
```

### Security Audit

```bash
# Run security checks
make audit

# Check for vulnerabilities
npm audit
pip audit
cargo audit
```

## Performance Metrics

### Build Performance

- **Full Build Time**: ~15-20 minutes (first time)
- **Incremental Build**: ~5-10 minutes
- **Backend Bundle Size**: ~50MB
- **LLM Model Size**: ~1.6GB
- **Frontend Bundle**: ~2MB
- **Total App Size**: ~100MB

### Runtime Performance

- **Startup Time**: <5 seconds
- **Memory Usage**: ~200MB base + 1GB for LLM
- **CPU Usage**: <5% idle, 20-50% during optimization
- **Disk I/O**: Optimized for SSD performance

## Support

For build issues:

1. Check the troubleshooting section above
2. Review build logs in `build.log`
3. Verify system requirements
4. Check GitHub issues for known problems
5. Create a new issue with build logs and system info

## Contributing

To contribute to the build system:

1. Test changes on clean systems
2. Update documentation
3. Add tests for new build steps
4. Ensure cross-platform compatibility
5. Follow security best practices
