# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OptiAI is an AI-powered desktop system optimizer built with React (frontend), Python FastAPI (backend), and Tauri (desktop wrapper). The application scans filesystems, generates AI-powered optimization suggestions, and executes safe cleanup actions with comprehensive undo functionality.

**Current Status**: Frontend and Tauri infrastructure are implemented. Backend Python modules are partially implemented or in development.

## Key Architecture Components

### Backend Architecture (Python FastAPI)

The backend follows a **policy-driven action pipeline** architecture:

1. **Scanner** - Multithreaded filesystem analysis, generates `FileInfo` objects
2. **Analysis Engine** - Rule-based heuristics for optimization suggestions
3. **AI Assistant** - LLM integration layer (Ollama/local models)
4. **Policy Manager** - Validates all actions against `policy.yaml` whitelist
5. **Action Engine** - Executes actions with backup/undo/quarantine
6. **Engine Flow** - Main workflow coordinator implementing scan → plan → preview → execute pipeline

**Note**: Check `backend/` directory for current implementation status of these modules.

### Security & Policy System

All actions must be validated through the policy system defined in `policy.yaml`:
- **Whitelisted Actions**: `send_to_trash`, `move`, `compress`, `ignore`
- **Protected Paths**: System directories (Windows, Program Files, /usr, /etc) are blocked
- **Constraints**: Batch limits (1000 items), size limits (20GB), quarantine TTL (7 days)
- **Risk Validation**: High-risk actions require double confirmation
- **Schema Validation**: All scan results and action plans validated against JSON schemas
- **LLM Guardrails**: Input sanitization and path validation for AI-generated plans

### Production Features (v1.0.0)

- **AI Tool Recommender** - Natural language queries → GitHub repo/tool suggestions
- **GitHub Auto-Installer** - One-click installation of GitHub repositories
- **Secure Vault** - AES-256-GCM encrypted storage with Argon2id key derivation
- **Process Manager** - Real-time process monitoring and management
- **Startup Manager** - Windows registry startup item management
- **System Profile** - System information generator for LLM context

### Frontend Architecture (React + Tauri)

**Main Components**:
- `App.jsx` - Main container with view routing
- `Dashboard.jsx` - Hub with tabs: AI Suggestions, Discover, Installed Apps, Vault
- `Processes.tsx`, `Startup.tsx` - TypeScript pages for system management
- `TreemapVisualization.jsx` - Recharts-based disk usage visualization
- `OptimizationPanel.jsx` - Displays AI suggestions with risk badges
- `ActionHistory.jsx` - Shows executed actions with undo capability

**Context Providers**:
- `ScanContext.jsx` - Manages scan state globally
- `AppContext.jsx` - Global application state

**UI System**: Tailwind CSS + Framer Motion for animations

API communication via fetch to `http://127.0.0.1:5175` (backend server port - standardized).

## Development Commands

### Quick Start
```bash
# Install all dependencies (Python + Node.js + Rust)
make install

# Start development environment (shows instructions for 3 terminals)
make dev
```

### Backend Development
```bash
# Activate venv and start backend server (port 5175)
cd backend
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Unix/macOS
uvicorn main:app --reload --port 5175
```

### Frontend Development
```bash
# Start Vite dev server (port 3001)
npm run dev
```

### Tauri Desktop App
```bash
# Development mode with hot reload
npm run tauri:dev

# Production build (creates MSI/NSIS/DMG/AppImage)
npm run tauri:build
```

### Testing
```bash
# Run all tests + license check (CI pipeline)
make ci

# Python backend tests only
cd backend && pytest tests/ -v

# Test with coverage
pytest tests/ --cov=backend

# License checking
python scripts/check_licenses.py
```

### Build & Release
```bash
# Clean build artifacts
make clean

# Full production build with optimization
make production-build-optimized

# Create release builds for all platforms
make release

# Build specific installers
make build-msi      # Windows MSI only
make build-nsis     # Windows NSIS only
```

## Policy Configuration (`policy.yaml`)

The `policy.yaml` file is the **security control center** for all system actions:

```yaml
allowed_actions: [send_to_trash, move, compress, ignore]
constraints:
  max_batch: 1000
  max_single_delete_bytes: 21474836480  # 20 GB
  require_confirm: true
  quarantine_ttl_days: 7
  protect_paths: ["/Windows", "/Program Files", "/usr", "/etc"]
extensions:
  duplicate_min_bytes: 1048576           # 1 MB minimum for dupes
  large_file_threshold: 1073741824       # 1 GB for large file detection
```

**Critical Security Rules**:
- Never bypass PolicyManager validation
- All LLM-generated plans must pass policy validation
- No shell commands in action execution (Python stdlib only)
- Protected paths are immutable and cannot be targeted

## Data Schemas

**JSON Schema Validation**: All scan results and action plans use strict schema validation in `schemas/` directory.
- Scan results: `scanned_at`, `summary`, `items[]`, `dupes[]`
- Action plans: `generated_at`, `explanation`, `actions[]` with risk levels

## LLM Integration

**Local LLM Support** via Ollama:
- Default server: `http://127.0.0.1:11434`
- Default model: `phi3-mini-dev` (configurable)
- **Safety**: All LLM outputs validated against policy rules and guardrails
- **Fallback**: Rule-based suggestions used if LLM unavailable

## API Endpoints

Backend REST API structure (FastAPI on port 5174):

**Core Endpoints**:
- `POST /api/scan` - Start background filesystem scan
- `GET /api/scan/{scan_id}/status` - Check scan progress
- `POST /api/optimize` - Generate AI optimization suggestions
- `POST /api/action` - Execute single action with validation
- `POST /api/undo` - Undo action by ID
- `GET /api/actions/history` - Action audit log

**Feature Endpoints**:
- `GET /api/metrics` - Real-time system metrics
- `POST /api/ai/plan` - Generate AI optimization plan
- `GET /api/ai/status` - Check LLM availability
- `POST /api/vault/*` - Vault operations (setup, unlock, secrets)
- `GET /api/process/*` - Process management
- `GET /api/startup/*` - Startup management (Windows only)

## Optional CLI Integrations

External tools with graceful fallback if not installed:
- **Czkawka** - Fast duplicate file finder
- **rmlint** - Advanced duplicate detection
- **BleachBit** - Predefined system cleanup rules

## Configuration & Ports

**Port Configuration**:
- Backend API: `5175` (standardized)
- Frontend Vite dev: `3001` (see `vite.config.js`)
- Tauri dev: Dynamic assignment
- Ollama LLM: `11434`

**CORS Origins** (backend accepts connections from):
- `http://localhost:1420` (Tauri)
- `http://localhost:3001` (Vite dev server)
- `http://localhost:5173` (Vite default)
- `http://localhost:5174` (Vite production)
- `http://localhost:5175` (Backend self-reference)
- `tauri://localhost` (Tauri protocol)

## Important Development Constraints

1. **No Shell Commands** - Action engine uses Python stdlib only for file operations
2. **Undo System** - All destructive actions create journal entries for rollback
3. **Quarantine TTL** - Deleted files quarantined 7 days before permanent deletion
4. **Schema Validation** - All scan/action data must pass JSON schema validation
5. **Windows-Specific** - Startup manager only works on Windows (registry-based)
6. **Protected Paths** - System directories automatically protected, cannot be targeted
7. **TypeScript Components** - `Processes.tsx` and `Startup.tsx` are TypeScript, most others are JSX

## Key File Paths

**Backend Output** (created at runtime):
- `out/scan.json` - Scan results
- `out/plan.json` - Action plans
- `out/preview.json` - Preview results
- `out/execution.json` - Execution logs

**Secure Storage**:
- Vault data: Platform-specific secure storage (OS keychain)
- Installed apps: Platform-specific app directory

## Deployment Artifacts

Tauri builds create platform-specific installers:
- **Windows**: `.msi` + `.exe` (NSIS) in `src-tauri/target/release/bundle/`
- **macOS**: `.dmg` bundle
- **Linux**: `.AppImage`

Final artifacts copied to `dist/` by Makefile `make release` command.
