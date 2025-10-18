# OptiAI - Implementation Guide for Enhancements

## Quick Start Testing

### 1. Run Comprehensive Tests
```bash
# Install dependencies if not done
pip install requests pyyaml

# Start backend first (in one terminal)
cd backend
uvicorn main:app --reload --port 5174

# Run tests (in another terminal)
python test_comprehensive.py
```

This will generate a detailed test report showing all passing/failing tests.

---

## Critical Bugs Fixed

### ✅ Bug #1: Duplicate `/api/undo` Endpoint
**Location**: `backend/main.py`
**Issue**: Two identical endpoints defined (lines 165 & 349)
**Status**: FIXED - Removed duplicate at line 349

### ✅ Bug #2: Duplicate `/api/actions/history` and `/api/actions/undoable`
**Location**: `backend/main.py`
**Issue**: Endpoints defined twice (lines 130-162 and 391-437)
**Status**: FIXED - Removed duplicates at lines 391-437

---

## Priority 1: Immediate Improvements (1-2 days)

### 1. Upgrade File Hashing Algorithm

**File**: `backend/scanner.py` and `backend/system_integration.py`

```python
# BEFORE (Line 242 in scanner.py)
hash_md5 = hashlib.md5()

# AFTER
hash_sha256 = hashlib.sha256()
```

**Implementation**:
```bash
# Find and replace all MD5 usage
cd backend
grep -r "hashlib.md5" .
# Manually replace with hashlib.sha256()
```

### 2. Add API Authentication

**File**: Create `backend/auth.py`

```python
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
import os

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == os.getenv("OPTIAI_API_KEY", "dev_key_12345"):
        return api_key
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid API Key"
    )
```

**File**: Update `backend/main.py`

```python
from auth import get_api_key
from fastapi import Depends

@app.post("/api/scan", dependencies=[Depends(get_api_key)])
async def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    # ... existing code
```

### 3. Add Rate Limiting

```bash
pip install slowapi
```

**File**: Update `backend/main.py`

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/scan")
@limiter.limit("5/minute")
async def start_scan(request: Request, scan_request: ScanRequest):
    # ... existing code
```

---

## Priority 2: Security Enhancements (3-5 days)

### 1. Encrypt Action Journal

**File**: Create `backend/journal_encryption.py`

```python
from cryptography.fernet import Fernet
import os
import json

class EncryptedJournal:
    def __init__(self, key_file=".journal_key"):
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                self.key = f.read()
        else:
            self.key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(self.key)
        self.cipher = Fernet(self.key)

    def encrypt_save(self, data, filename):
        json_data = json.dumps(data)
        encrypted = self.cipher.encrypt(json_data.encode())
        with open(filename, 'wb') as f:
            f.write(encrypted)

    def decrypt_load(self, filename):
        with open(filename, 'rb') as f:
            encrypted = f.read()
        decrypted = self.cipher.decrypt(encrypted)
        return json.loads(decrypted.decode())
```

### 2. Add Input Validation

**File**: Create `backend/validators.py`

```python
import re
from pathlib import Path

def validate_path(path: str) -> bool:
    """Validate file path to prevent injection"""
    # No null bytes
    if '\x00' in path:
        return False

    # No path traversal
    if '..' in path:
        return False

    # Must be absolute path
    if not Path(path).is_absolute():
        return False

    return True

def sanitize_action_input(action_data: dict) -> dict:
    """Sanitize action input data"""
    if 'target_path' in action_data:
        if not validate_path(action_data['target_path']):
            raise ValueError("Invalid target path")

    return action_data
```

---

## Priority 3: Performance Optimizations (5-7 days)

### 1. Add Database Layer

```bash
pip install sqlalchemy alembic
```

**File**: Create `backend/database.py`

```python
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./optiai.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class ScanRecord(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True)
    scan_id = Column(String, unique=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String)
    result = Column(JSON)

class ActionRecord(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True)
    action_id = Column(String, unique=True)
    action_type = Column(String)
    timestamp = Column(DateTime)
    original_path = Column(String)
    status = Column(String)
    metadata = Column(JSON)

# Create tables
Base.metadata.create_all(bind=engine)
```

**File**: Update `backend/main.py`

```python
from database import SessionLocal, ScanRecord

@app.post("/api/scan")
async def start_scan(request: ScanRequest):
    scan_id = f"scan_{int(datetime.now().timestamp())}"

    # Save to database instead of in-memory cache
    db = SessionLocal()
    scan_record = ScanRecord(
        scan_id=scan_id,
        status="started"
    )
    db.add(scan_record)
    db.commit()
    db.close()

    # ... rest of code
```

### 2. Optimize Large File Hashing

**File**: Update `backend/scanner.py`

```python
def _compute_file_hash_optimized(self, file_path: str, max_size_mb: int = 100) -> str:
    """Compute hash efficiently for large files"""
    file_size = os.path.getsize(file_path)

    # Small files: full hash
    if file_size < 2 * 1024 * 1024:  # < 2MB
        return self._compute_file_hash(file_path)

    # Large files: sample-based hash (first 1MB + last 1MB + size)
    hash_sha256 = hashlib.sha256()

    try:
        with open(file_path, "rb") as f:
            # First 1MB
            chunk = f.read(1024 * 1024)
            hash_sha256.update(chunk)

            # Last 1MB
            f.seek(-1024 * 1024, 2)
            chunk = f.read(1024 * 1024)
            hash_sha256.update(chunk)

            # Include file size in hash
            hash_sha256.update(str(file_size).encode())

        return hash_sha256.hexdigest()
    except (OSError, PermissionError):
        return ""
```

### 3. Add Streaming for Large Results

**File**: Update `backend/main.py`

```python
from fastapi.responses import StreamingResponse
import asyncio

async def stream_scan_results(scan_id: str):
    """Stream scan results as NDJSON"""
    while True:
        if scan_id not in scan_cache:
            break

        status = scan_cache[scan_id]
        yield json.dumps(status) + "\n"

        if status["status"] in ["completed", "failed"]:
            break

        await asyncio.sleep(1)

@app.get("/api/scan/{scan_id}/stream")
async def stream_scan_status(scan_id: str):
    return StreamingResponse(
        stream_scan_results(scan_id),
        media_type="application/x-ndjson"
    )
```

---

## Priority 4: Frontend Improvements (3-5 days)

### 1. Add Error Boundary

**File**: Create `src/components/ErrorBoundary.jsx`

```jsx
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50">
                    <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">
                            Something went wrong
                        </h2>
                        <p className="text-gray-700 mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
```

### 2. Create API Client Abstraction

**File**: Create `src/api/client.js`

```javascript
const API_BASE = 'http://127.0.0.1:5174/api';

class APIClient {
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Scan endpoints
    scan = {
        start: (paths, maxWorkers = 4) =>
            this.request('/scan', {
                method: 'POST',
                body: JSON.stringify({ paths, max_workers: maxWorkers })
            }),

        status: (scanId) => this.request(`/scan/${scanId}/status`),

        stream: (scanId) => `${API_BASE}/scan/${scanId}/stream`
    };

    // Metrics endpoints
    metrics = {
        get: () => this.request('/metrics'),
        systemInfo: () => this.request('/system/info')
    };

    // Action endpoints
    actions = {
        execute: (actionType, targetPath, options = {}) =>
            this.request('/action', {
                method: 'POST',
                body: JSON.stringify({
                    action_type: actionType,
                    target_path: targetPath,
                    ...options
                })
            }),

        undo: (actionId) =>
            this.request('/undo', {
                method: 'POST',
                body: JSON.stringify({ action_id: actionId })
            }),

        history: (limit = 50) =>
            this.request(`/actions/history?limit=${limit}`),

        undoable: () => this.request('/actions/undoable')
    };
}

export default new APIClient();
```

**Usage in components**:

```javascript
import apiClient from '../api/client';

// In component
const handleStartScan = async () => {
    try {
        const result = await apiClient.scan.start(['/path/to/scan']);
        console.log('Scan started:', result.scan_id);
    } catch (error) {
        showToast(`Scan failed: ${error.message}`, 'error');
    }
};
```

---

## Testing Your Changes

### Unit Tests Template

**File**: Create `backend/tests/test_scanner.py`

```python
import pytest
from backend.scanner import SystemScanner, FileInfo
import tempfile
import os

def test_scanner_initialization():
    scanner = SystemScanner(max_workers=4)
    assert scanner.max_workers == 4
    assert scanner.large_file_threshold == 100 * 1024 * 1024

def test_file_info_creation():
    file_info = FileInfo(
        path="/tmp/test.txt",
        size=1024,
        is_directory=False,
        modified_time=1234567890,
        created_time=1234567890
    )
    assert file_info.path == "/tmp/test.txt"
    assert file_info.size == 1024

def test_scan_safe_path():
    scanner = SystemScanner()

    # Create temp directory with test files
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test files
        test_file = os.path.join(tmpdir, "test.txt")
        with open(test_file, 'w') as f:
            f.write("test content")

        # Scan the temp directory
        result = scanner.scan_system([tmpdir])

        assert result.total_files > 0
        assert result.scan_duration >= 0
```

### Integration Tests

**File**: Create `backend/tests/test_api_integration.py`

```python
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_metrics_endpoint():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "cpu" in data
    assert "memory" in data

def test_scan_endpoint():
    response = client.post(
        "/api/scan",
        json={"paths": ["/tmp"], "max_workers": 2}
    )
    assert response.status_code == 200
    data = response.json()
    assert "scan_id" in data
    assert data["status"] == "started"
```

### Run All Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run all tests with coverage
pytest backend/tests/ -v --cov=backend --cov-report=html

# View coverage report
open htmlcov/index.html  # macOS/Linux
start htmlcov/index.html  # Windows
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`pytest backend/tests/`)
- [ ] Lint checks passing (`flake8 backend/`)
- [ ] Type checks passing (`mypy backend/`)
- [ ] Security scan (`bandit -r backend/`)
- [ ] Dependencies updated (`pip list --outdated`)
- [ ] Frontend builds (`npm run build`)
- [ ] Tauri builds (`npm run tauri:build`)

### Environment Variables

Create `.env` file:

```bash
# API Configuration
OPTIAI_API_KEY=your_secure_api_key_here
DATABASE_URL=sqlite:///./optiai.db

# LLM Configuration
OLLAMA_URL=http://127.0.0.1:11434
LLM_MODEL=phi3-mini-dev

# Security
SECRET_KEY=your_secret_key_here_min_32_chars
VAULT_MASTER_KEY=your_vault_key_here

# Monitoring
LOG_LEVEL=INFO
SENTRY_DSN=optional_sentry_dsn
```

### Production Deployment

```bash
# Build backend
cd backend
pip install -r requirements.txt --no-cache-dir

# Build frontend
cd ..
npm install --production
npm run build

# Build Tauri app
npm run tauri:build

# Output: src-tauri/target/release/bundle/
```

---

## Monitoring & Maintenance

### Add Logging

**File**: Create `backend/logging_config.py`

```python
import logging
import sys

def setup_logging(level=logging.INFO):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('optiai.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )

    return logging.getLogger('optiai')

logger = setup_logging()
```

### Health Monitoring

Add to `backend/main.py`:

```python
@app.get("/health/live")
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive", "timestamp": datetime.now().isoformat()}

@app.get("/health/ready")
async def readiness():
    """Kubernetes readiness probe"""
    try:
        # Check database connection
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()

        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"status": "not_ready", "error": str(e)}
        )
```

---

## Support & Resources

- **Documentation**: See `README.md` and `CLAUDE.md`
- **Analysis Report**: See `ANALYSIS_REPORT.md`
- **Test Script**: Run `python test_comprehensive.py`
- **Issues**: Report to project maintainer

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
