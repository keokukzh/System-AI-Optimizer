<!-- 95d10f30-9fb5-4d09-884c-b6ec2803a068 7487a5bd-6f84-49af-b3ce-7d8c99dc9aca -->
# OptiAI Production Finalization Plan

## Phase 0: Pre-Build Cleanup & Optimization

### 0.1 Code Cleanup

- Remove unused dependencies from package.json and requirements.txt
- Clean up all console.log and debug logging statements throughout codebase
- Remove commented-out code blocks
- Delete unused components and utilities
- Remove test/development files that shouldn't be in production build
- Clean up duplicate TODO items in todo list

### 0.2 Dependency Audit

- Run `npm audit` and fix vulnerabilities
- Run `pip audit` for Python dependencies
- Remove unused npm packages
- Update outdated dependencies to latest stable versions
- Verify all dependencies are properly licensed

### 0.3 Environment Configuration

- Document all environment variables needed
- Remove hardcoded credentials or API keys
- Verify no sensitive data in code
- Clean up .env files and create .env.example
- Update .gitignore for production artifacts

### 0.4 Build Artifacts Cleanup

- Remove existing dist/ directory
- Clean src-tauri/target/ directory
- Clear node_modules/.vite/ cache
- Remove backend **pycache** directories
- Clear any temporary test files

## Phase 1: Backend Python Bundling Setup

### 1.1 Configure Python Embedding

- Create `backend/embed_python.py` script to bundle Python runtime with the application
- Use PyInstaller or Nuitka to create standalone Python executable for the backend
- Create `backend/pyinstaller.spec` configuration file:
  - Include all backend modules and dependencies
  - Bundle FastAPI, uvicorn, and all required packages
  - Set console=False for GUI mode
  - Configure icon and metadata
- Update `tauri.conf.json` to reference bundled Python backend as external binary:
  ```json
  "externalBin": [
    "sidecars/backend-server.exe",
    "sidecars/llama-server.exe"
  ]
  ```


### 1.2 Backend Startup Configuration

- Create `backend/startup.py` wrapper script that:
  - Checks for available ports (5174 or fallback)
  - Initializes backend with embedded Python
  - Creates PID file for process management
  - Handles graceful shutdown
- Add backend auto-start logic to Tauri main.rs
- Configure backend to start as child process with proper admin rights

## Phase 2: Lightweight LLM Integration

### 2.1 Download and Optimize LLM Model

- Select lightweight model (phi-2 or TinyLlama ~1-3GB) optimized for system operations
- Download and quantize model using llama.cpp tools:
  - Create `scripts/download_model.py` to fetch model
  - Quantize to GGUF format (Q4_K_M for balance)
  - Store in `resources/models/` directory
- Create model configuration file `resources/models/config.json` with:
  - Model path and parameters
  - Context window size (2048 tokens)
  - Temperature and sampling settings

### 2.2 Integrate llama.cpp Server

- Build llama.cpp server for Windows (llama-server.exe)
- Place compiled binary in `src-tauri/sidecars/`
- Create `backend/ai/local_llm.py` wrapper:
  - Start/stop llama-server as subprocess
  - Configure model loading and inference
  - Implement fallback to rule-based suggestions if LLM fails
- Update `backend/ai/llm_runtime.py` to use local model by default
- Add LLM health check and auto-restart logic

## Phase 3: Auto-Updater Implementation

### 3.1 Tauri Updater Configuration

- Update `tauri.conf.json` with updater settings:
  ```json
  "updater": {
    "active": true,
    "endpoints": [
      "https://github.com/yourusername/optiai/releases/latest/download/latest.json"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY_HERE"
  }
  ```

- Generate RSA key pair for signing updates:
  ```bash
  tauri signer generate -w ~/.tauri/optiai.key
  ```


### 3.2 Update Server Setup

- Create `scripts/generate_update_manifest.py` to generate update JSON
- Create GitHub Actions workflow `.github/workflows/release.yml`:
  - Build installers for each release
  - Sign binaries with Tauri signer
  - Generate update manifest
  - Upload to GitHub Releases
- Implement version checking logic in frontend:
  - Create `src/components/UpdateNotification.jsx`
  - Add update check on app startup
  - Show update dialog with changelog

## Phase 4: Admin Rights & Permissions

### 4.1 Windows UAC Configuration

- Update `src-tauri/tauri.conf.json` Windows settings:
  ```json
  "windows": {
    "certificateThumbprint": null,
    "digestAlgorithm": "sha256",
    "timestampUrl": "",
    "tsp": false,
    "wix": {
      "language": "en-US",
      "template": "custom.wxs"
    },
    "webviewInstallMode": {
      "type": "embedBootstrapper"
    }
  }
  ```

- Create `src-tauri/wix/custom.wxs` WiX template:
  - Request administrator privileges
  - Add registry keys for auto-start (optional)
  - Configure firewall rules for backend port
  - Set proper file permissions

### 4.2 Capability Manifest

- Create `src-tauri/capabilities/default.json`:
  - Enable filesystem access with elevated permissions
  - Allow process management and system queries
  - Configure network access for backend communication
  - Enable registry access for startup management

## Phase 5: Comprehensive Docker Testing Environment

### 5.1 Docker Test Setup

- Create `Dockerfile.test` for Windows-based testing environment:
  ```dockerfile
  FROM mcr.microsoft.com/windows/servercore:ltsc2022
  # Install Python, Node.js, Rust toolchain
  # Copy application files
  # Run integration tests
  ```

- Create `docker-compose.test.yml` for multi-container testing:
  - Backend service (FastAPI)
  - Frontend service (Vite)
  - Test runner service (Playwright/Cypress)
  - VNC server for GUI testing

### 5.2 Test Automation Suite

- Create `tests/e2e/` directory with end-to-end tests:
  - `test_app_launch.py` - Verify app launches successfully
  - `test_navigation.py` - Test all navigation routes
  - `test_scan_functionality.py` - Test file scanning
  - `test_ai_suggestions.py` - Test LLM integration
  - `test_automation_rules.py` - Test automation features
  - `test_vault_security.py` - Test secure vault
  - `test_process_management.py` - Test process operations
  - `test_persistence.py` - Test settings persistence

### 5.3 Docker MCP Integration

- Use MCP browser tools to test UI in containerized environment:
  - Navigate to application URL in Docker VNC
  - Take screenshots at each test step
  - Verify all components render correctly
  - Test user interactions and workflows
- Create `tests/docker_mcp_tests.js` for automated browser testing
- Generate test report with screenshots and logs

## Phase 6: Production Build Configuration

### 6.1 Optimize Build Settings

- Update `vite.config.js` for production:
  - Enable minification and tree-shaking
  - Configure chunk splitting for optimal loading
  - Generate source maps for debugging
  - Set base URL for bundled resources
- Update `tauri.conf.json` build settings:
  - Set distDir to production build output
  - Configure resource bundling
  - Enable compression for assets

### 6.2 Pre-build Checklist Script

- Create `scripts/pre_build_checklist.py`:
  - Verify all dependencies installed
  - Check for linting errors
  - Validate configuration files
  - Ensure models and resources are present
  - Run smoke tests
  - Generate build metadata

## Phase 7: Windows Installer Creation

### 7.1 MSI Installer Configuration

- Create `installer/wix_config.json` with:
  - Application metadata (name, version, publisher)
  - Installation directory defaults
  - Start menu shortcuts
  - Desktop shortcut option
  - File associations (optional)
  - Uninstaller configuration
- Configure WiX Toolset settings:
  - Custom UI dialogs
  - License agreement
  - Installation options (full/minimal)
  - Post-install scripts

### 7.2 NSIS Installer (Alternative)

- Create `installer/nsis_script.nsi`:
  - Modern UI theme
  - Multi-language support
  - Component selection
  - Registry entries for uninstallation
  - Service installation for backend
  - Auto-run configuration

## Phase 8: Testing & Quality Assurance

### 8.1 Manual Testing Checklist

- Launch application from installer
- Verify admin rights are granted
- Test backend auto-start and connectivity
- Verify LLM model loads and responds
- Test all navigation routes
- Perform full system scan
- Test AI suggestions generation
- Verify automation scheduling works
- Test vault encryption/decryption
- Verify process management features
- Test settings persistence
- Test auto-updater notification

### 8.2 Docker-based Integration Tests

- Build Docker test environment:
  ```bash
  docker build -f Dockerfile.test -t optiai-test .
  docker-compose -f docker-compose.test.yml up
  ```

- Run automated test suite in Docker
- Use MCP browser tools to test UI in VNC environment
- Generate comprehensive test report
- Capture screenshots and performance metrics

### 8.3 Performance Testing

- Create `tests/performance/` benchmarks:
  - Measure app startup time
  - Test scan performance with large directories
  - Measure LLM response time
  - Test memory usage under load
  - Verify UI responsiveness
- Set performance thresholds and validate

## Phase 9: Final Build & Packaging

### 9.1 Production Build

- Run pre-build checklist script
- Execute production build:
  ```bash
  npm run build
  npm run tauri:build
  ```

- Verify build artifacts:
  - MSI installer in `src-tauri/target/release/bundle/msi/`
  - NSIS installer in `src-tauri/target/release/bundle/nsis/`
  - Executable in `src-tauri/target/release/`

### 9.2 Post-build Validation

- Install MSI on clean Windows VM
- Verify all components work
- Test uninstaller
- Check disk space requirements
- Verify no residual files after uninstall

## Phase 10: Distribution Preparation

### 10.1 Release Artifacts

- Create `dist/` directory structure:
  ```
  dist/
  ├── OptiAI_v1.0.0_setup.msi
  ├── OptiAI_v1.0.0_setup.exe (NSIS)
  ├── OptiAI_v1.0.0_portable.zip (optional)
  ├── README.txt
  ├── LICENSE.txt
  ├── CHANGELOG.md
  └── checksums.sha256
  ```

- Generate SHA256 checksums for all installers
- Create release notes document

### 10.2 Documentation

- Update `README.md` with:
  - System requirements
  - Installation instructions
  - First-run guide
  - Troubleshooting section
- Create user manual `docs/USER_GUIDE.md`
- Create developer documentation `docs/DEVELOPER.md`

## Phase 11: Final Verification

### 11.1 Security & Compliance

- Run full test suite one more time
- Perform security audit with npm audit and pip audit
- Check license compliance for all dependencies
- Verify no hardcoded credentials or API keys
- Ensure proper error handling throughout
- Scan for common vulnerabilities (SQL injection, XSS, etc.)

### 11.2 Installation Testing

- Test installer on multiple Windows versions (10, 11)
- Verify clean installation on fresh OS
- Test upgrade path from previous version
- Verify uninstaller removes all files
- Check for registry cleanup after uninstall

## Deliverables

1. **Production-ready Windows Installer**

   - OptiAI_v1.0.0_setup.msi (signed MSI installer)
   - OptiAI_v1.0.0_setup.exe (NSIS installer)
   - Includes bundled Python backend
   - Includes pre-optimized LLM model
   - Configured with admin rights

2. **Auto-updater**

   - Configured and tested
   - GitHub release integration
   - Signed update manifests

3. **Test Suite**

   - Comprehensive Docker-based tests
   - MCP browser automation tests
   - Performance benchmarks
   - Test reports and screenshots

4. **Documentation**

   - Installation guide
   - User manual
   - Developer documentation
   - Troubleshooting guide

5. **Distribution Package**

   - All installers with checksums
   - Release notes
   - License information
   - README files

## Success Criteria

- Application installs successfully with admin rights
- Backend starts automatically with bundled Python
- LLM model loads and provides AI suggestions
- All features work as expected
- Auto-updater successfully checks for updates
- All tests pass in Docker environment
- Performance metrics meet targets (startup < 5s, scan < 30s for 10GB)
- No critical security vulnerabilities
- Uninstaller removes all files cleanly
- Application runs on fresh Windows 10/11 installation

### To-dos

- [x] Create useReducedMotion hook and update GlassCard with motion preferences
- [x] Add reduced-motion utilities to tailwind.config.js
- [x] Enhance EmptyState component with glassmorphism, stats, and animations
- [x] Implement React.lazy() for Dashboard tab components
- [x] Add Suspense boundaries with loading fallbacks
- [x] Refactor StatusDock to show only 3 core metrics (CPU/RAM/Disk)
- [x] Create StatusBadge component and add Network/AI badges to App header
- [x] Extract search logic from CommandPalette into useCommandSearch hook
- [x] Create UnifiedSearch component for header with recent actions and suggestions
- [x] Integrate UnifiedSearch into App header, keep Ctrl+K shortcut
- [x] Run full testing checklist and verify all optimizations