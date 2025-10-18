# OptiAI - Quick Access Guide

## 🚀 Running Servers

### Current Status: ✅ RUNNING

```
Backend:  http://127.0.0.1:5174  [✓ Healthy]
Frontend: http://127.0.0.1:5177  [✓ Running]
```

---

## 🌐 Quick Links

### Application
- **Main App:** http://127.0.0.1:5177
- **API Docs:** http://127.0.0.1:5174/docs
- **Health Check:** http://127.0.0.1:5174/health

### API Endpoints (Examples)

#### System
```bash
# Get system information
curl http://127.0.0.1:5174/api/system/info

# Get real-time metrics
curl http://127.0.0.1:5174/api/metrics

# Get system profile
curl http://127.0.0.1:5174/api/system/profile
```

#### License
```bash
# Get license status
curl http://127.0.0.1:5174/api/license/status

# Get license info
curl http://127.0.0.1:5174/api/license/info
```

#### Actions
```bash
# Get action history
curl http://127.0.0.1:5174/api/actions/history

# Get undoable actions
curl http://127.0.0.1:5174/api/actions/undoable
```

#### AI Features
```bash
# Check AI status
curl http://127.0.0.1:5174/api/ai/status

# Get tool suggestions (POST)
curl -X POST http://127.0.0.1:5174/api/ai/tools/suggest \
  -H "Content-Type: application/json" \
  -d '{"query": "video editor"}'
```

#### Vault
```bash
# Get vault status
curl http://127.0.0.1:5174/api/vault/status

# List secrets (when unlocked)
curl http://127.0.0.1:5174/api/vault/list
```

#### Process Management
```bash
# List processes
curl http://127.0.0.1:5174/api/process/list

# Get process stats
curl http://127.0.0.1:5174/api/process/stats
```

#### Startup Management (Windows)
```bash
# Check startup status
curl http://127.0.0.1:5174/api/startup/status

# List startup items
curl http://127.0.0.1:5174/api/startup/list
```

---

## 🛠️ Server Management

### Start Servers

#### Method 1: Already Running
Servers are already running in the background!

#### Method 2: Manual Start (if needed)

**Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --port 5174 --host 127.0.0.1
```

**Frontend:**
```bash
npm run dev
```

### Stop Servers

```bash
# Find and kill backend (PowerShell)
Get-Process | Where-Object {$_.ProcessName -like "*python*" -and $_.Modules.FileName -like "*uvicorn*"} | Stop-Process

# Find and kill frontend (PowerShell)
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process
```

### Restart Servers

```bash
# Kill existing processes then start again
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# Then start backend and frontend again
```

---

## 🐛 Troubleshooting

### Issue: Cannot access http://127.0.0.1:5177

**Solution:**
```bash
# Check if port is listening
netstat -an | Select-String "5177"

# If not running, start frontend
npm run dev
```

### Issue: API errors (500, 404)

**Solution:**
```bash
# Check backend health
curl http://127.0.0.1:5174/health

# If not healthy, restart backend
cd backend
python -m uvicorn main:app --reload --port 5174
```

### Issue: CORS errors in browser

**Status:** ✅ Already fixed!
- Backend CORS now includes port 5177
- Should work without issues

### Issue: "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
npm install
cd backend
pip install -r ../requirements.txt
```

---

## 📚 Documentation Files

### Primary Documentation
- **README.md** - Main project documentation
- **CLAUDE.md** - AI assistant guide for this repo
- **DEBUG_REPORT.md** - Current debugging status (THIS SESSION)
- **QUICK_START.md** - Quick start checklist
- **TROUBLESHOOTING.md** - Troubleshooting guide

### Analysis Documents
- **ANALYSIS_REPORT.md** - 35-page technical analysis
- **IMPLEMENTATION_GUIDE.md** - Implementation roadmap
- **README_PRODUCTION.md** - Production features

### Change Logs
- **CHANGELOG.md** - Version history
- **VERIFICATION_COMPLETE.md** - Verification status
- **UI_IMPROVEMENTS_SUMMARY.md** - UI enhancements

---

## 🎯 Common Tasks

### Run Tests
```bash
# Python backend tests
cd backend
pytest tests/ -v

# Production feature tests
python test_production_features.py
python test_process_startup_features.py
```

### Check Licenses
```bash
python scripts/check_licenses.py
```

### Build for Production
```bash
# Build everything
npm run build

# Build Tauri desktop app
npm run tauri:build
```

### Clean Build Artifacts
```bash
make clean
```

---

## 📊 Project Structure Quick Reference

```
System-AI-Optimizer/
├── backend/                 # FastAPI backend
│   ├── main.py             # API server (Port 5174)
│   ├── scanner.py          # File system scanner
│   ├── ai/                 # AI integration
│   ├── vault/              # Secure storage
│   ├── process/            # Process management
│   └── startup/            # Startup management
├── src/                    # React frontend
│   ├── App.jsx             # Main app component
│   ├── components/         # UI components
│   └── pages/              # Page components
├── src-tauri/              # Tauri desktop wrapper
├── schemas/                # JSON validation schemas
├── tests/                  # Test suite
├── scripts/                # Utility scripts
├── vite.config.js          # Vite config (Port 5177) ⭐
└── policy.yaml             # Security policies
```

---

## 🔐 Security Notes

### Protected Paths (Automatic)
- `C:\Windows`
- `C:\Program Files`
- `C:\Program Files (x86)`
- `/usr`, `/etc` (Unix)

### Safe Actions Only
- `send_to_trash` - Move to recycle bin
- `move` - Relocate files
- `compress` - Compress files
- `ignore` - Skip files

### No Shell Access
- All file operations use Python stdlib
- No subprocess shell commands
- Policy-validated actions only

---

## ⚡ Performance Tips

### Frontend
- HMR is enabled - instant updates
- Components are lazy-loaded where possible
- Tailwind purges unused CSS in production

### Backend
- Auto-reload enabled in dev mode
- Multithreaded file scanning
- In-memory caching for scans

### Database
- Currently uses in-memory storage
- Scan results cached in Python dict
- For production: Consider Redis/PostgreSQL

---

## 🎨 Key Features Access

### From Dashboard (http://127.0.0.1:5177)

1. **System Metrics** - Top of dashboard
2. **AI Suggestions** - Tab 1
3. **Discover Tools** - Tab 2
4. **Installed Apps** - Tab 3
5. **Secure Vault** - Tab 4
6. **Processes** - Sidebar link
7. **Startup Items** - Sidebar link (Windows only)

---

## 📞 Need Help?

1. Check **DEBUG_REPORT.md** for current status
2. Review **TROUBLESHOOTING.md** for common issues
3. Check **CLAUDE.md** for architecture details
4. Review browser console (F12) for frontend errors
5. Check backend terminal for API errors

---

**Last Updated:** October 17, 2025  
**Servers:** Backend (5174) + Frontend (5177)  
**Status:** ✅ All systems operational

