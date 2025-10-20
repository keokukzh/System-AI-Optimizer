<!-- 34307eab-c9cc-4384-aa53-9d03554f0e5c f85af3b9-bba9-4f97-b4a5-6d77fdc0ed66 -->
# Fix ERRCONNECTIONREFUSED and Create Auto-Start System

## Problem Analysis

The user is getting `ERR_CONNECTION_REFUSED` because:

1. Backend server is NOT running (no process listening on port 5175)
2. The existing `start_optiai.bat` doesn't check for dependencies or virtual environment
3. Need automated dependency installation and proper error handling

## Solution: Enhanced Startup Script with Dependency Management

### 1. Create Enhanced Windows Startup Script

File: `start_optiai_fixed.bat`

**Features:**

- Check if Python is installed
- Check/create virtual environment in `backend/.venv`
- Auto-install missing dependencies from `requirements.txt`
- Start backend server with proper error handling
- Wait for backend to be ready (health check)
- Start frontend
- Show clear error messages if anything fails

**Key sections:**

```batch
# Check Python installation
# Create/activate venv if needed
# Install dependencies if missing
# Start backend with uvicorn
# Health check backend endpoint
# Start frontend with npm
# Display access URLs
```

### 2. Create Health Check Script

File: `check_backend.py`

**Purpose:** Wait for backend to be fully ready before starting frontend

```python
import requests
import time
import sys

for attempt in range(30):
    try:
        response = requests.get("http://127.0.0.1:5175/health", timeout=2)
        if response.status_code == 200:
            print("Backend is ready!")
            sys.exit(0)
    except:
        pass
    time.sleep(1)

print("Backend failed to start")
sys.exit(1)
```

### 3. Add Dependency Check Script

File: `backend/check_dependencies.py`

**Purpose:** Verify all required packages are installed

```python
required = ['fastapi', 'uvicorn', 'psutil', 'cryptography', 'gitpython', 'github']
missing = []
for package in required:
    try:
        __import__(package)
    except ImportError:
        missing.append(package)

if missing:
    print(f"Missing packages: {', '.join(missing)}")
    sys.exit(1)
else:
    print("All dependencies installed")
    sys.exit(0)
```

### 4. Update `start_optiai.bat` 

**Changes:**

- Add Python/pip checks
- Add venv creation/activation
- Add dependency auto-install
- Add backend health check before starting frontend
- Add error handling with clear messages
- Show process IDs for easy management

### 5. Create Simple One-Click Launcher

File: `START_HERE.bat`

**Purpose:** Dead-simple launcher that handles everything

```batch
@echo off
title OptiAI Launcher
cd /d "%~dp0"
start_optiai_fixed.bat
```

## Files to Modify/Create

1. **Create** `start_optiai_fixed.bat` - Enhanced startup with dependency management
2. **Create** `check_backend.py` - Backend health checker
3. **Create** `backend/check_dependencies.py` - Dependency verification
4. **Create** `START_HERE.bat` - Simple one-click launcher
5. **Update** `START_OPTIAI_NOW.md` - Documentation with troubleshooting

## Expected Outcome

After running `START_HERE.bat`:

1. Virtual environment is created/activated automatically
2. Missing dependencies are installed automatically
3. Backend starts on port 5175 and becomes ready
4. Frontend starts on port 3002
5. User sees: "Backend: http://127.0.0.1:5175" and "Frontend: http://localhost:3002"
6. Browser can access both URLs without connection errors
7. All features are functional

## Error Handling

Script will show clear messages for common issues:

- Python not installed → Show download link
- pip not working → Show fix command
- Port already in use → Show how to kill process
- Dependencies fail → Show manual install command
- Backend won't start → Show log file location

### To-dos

- [ ] Fix port mismatch - standardize on 5175 in backend/main.py and verify environment.js
- [ ] Create backend module structure: installer/, vault/ directories with __init__.py
- [ ] Implement GitHubInstaller class with clone, dependency install, and launcher creation
- [ ] Add installer API endpoints: /api/installer/github, /apps, /launch, /app/{id}
- [ ] Implement VaultManager with AES-256-GCM encryption and PBKDF2 key derivation
- [ ] Add vault API endpoints: status, unlock, lock, list, set, get, remove
- [ ] Implement AI tool recommender with GitHub API integration and LLM enhancement
- [ ] Add /api/ai/tools/suggest endpoint with fallback to curated list
- [ ] Remove duplicate /api/optimize endpoint in backend/main.py
- [ ] Replace all hardcoded ports in DiscoverTab, InstalledAppsTab, VaultTab with API_CONFIG.BASE_URL
- [ ] Add cryptography, gitpython, PyGithub to backend/requirements.txt
- [ ] Test all features: scan, discover, GitHub install, vault, processes, startup
- [ ] Update CLAUDE.md, README.md, DEVELOPMENT_SETUP.md with correct port info