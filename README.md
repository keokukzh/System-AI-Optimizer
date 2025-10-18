# OptiAI - AI-Powered System Optimizer

A comprehensive desktop application that uses AI to analyze and optimize your system, providing intelligent suggestions for cleaning up files, removing duplicates, and freeing up disk space.

## 🚀 Features

### Core Functionality
- **System Scanner**: Recursive file analysis with multithreading support
- **AI Assistant**: Local LLM integration for intelligent optimization suggestions
- **Safe Actions**: Whitelisted actions with undo functionality and quarantine system
- **Real-time Metrics**: Live system monitoring (CPU, RAM, Disk usage)
- **Treemap Visualization**: Interactive disk usage visualization
- **Policy System**: Configurable security policies and constraints

### New Production Features (v1.0.0)
- **AI Tool Recommender**: Natural language queries → real tool suggestions (GitHub repos, apps, packages)
- **GitHub Auto-Installer**: One-click installation of GitHub repositories with dependency management
- **Secure Vault**: AES-256-GCM encrypted storage for API keys and sensitive data
- **Discover Tab**: AI-powered tool discovery with real-time recommendations
- **Installed Apps Manager**: Manage and launch installed GitHub applications
- **Advanced Security**: OS keychain integration, master password protection, audit logging

### Production Security Hardening (v1.0.0)
- **Policy Engine**: Risk-based validation with double confirmation for high-risk actions
- **Enhanced Vault**: Argon2id key derivation + OS keychain integration + auto-lock
- **Secure Installer**: SBOM generation + license checking + forbidden license blocking
- **LLM Guardrails**: Input sanitization + path validation + shell injection prevention
- **Double Validation**: Schema validation + policy rules + guardrails for all AI plans
- **High-Risk Protection**: System path detection + dangerous file type blocking + batch size limits

### Process & Startup Management (v1.0.0)
- **Process Manager**: Real-time process monitoring, termination, and priority management
- **Startup Manager**: Windows registry startup management with enable/disable/restore
- **System Profile**: Comprehensive system information for LLM context and optimization
- **Security Features**: Protected process detection, rate limiting, and admin privilege handling
- **Cross-Platform**: Process management on all platforms, startup management Windows-only
- **API Integration**: RESTful endpoints for all process and startup operations

### Optimization Capabilities
- **Large File Detection**: Find and manage files over 1GB
- **Duplicate Removal**: Intelligent duplicate file detection and cleanup
- **Temp File Cleanup**: Automatic detection and removal of temporary files
- **Empty Directory Cleanup**: Remove empty directories safely
- **Cache Management**: Clean application caches and logs
- **Compression**: Compress old files to save space

### Security & Safety
- **Dry Run Mode**: Preview all actions before execution
- **Undo System**: Complete undo functionality with backup system
- **Quarantine**: Safe file quarantine with TTL (7 days default)
- **Policy Validation**: Whitelisted actions only, no shell access
- **System Protection**: Automatic protection of system directories

## 🏗️ Architecture

### Backend (Python)
- **Scanner**: `backend/scanner.py` - System file analysis
- **Analysis Engine**: `backend/analysis_engine.py` - Rule-based heuristics
- **AI Assistant**: `backend/ai_assistant.py` - LLM integration
- **Action Engine**: `backend/action_engine.py` - Safe action execution
- **Policy Manager**: `backend/policy_manager.py` - Security policies
- **Engine Flow**: `backend/engine_flow.py` - Main workflow coordinator

### Frontend (React + Tauri)
- **Dashboard**: System overview with metrics and quick actions
- **Treemap**: Interactive disk usage visualization
- **File List**: Detailed file analysis with sorting and filtering
- **Optimization Panel**: AI suggestions with risk assessment
- **Action History**: Complete audit trail with undo capability

### CLI Integrations
- **Czkawka**: Fast duplicate detection and large file finding
- **rmlint**: Advanced duplicate detection and cleanup
- **BleachBit**: System cleanup with predefined rules

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- Rust (for Tauri)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-org/optiai.git
cd optiai

# Install dependencies
make install

# Start development environment
make dev
```

### Manual Installation
```bash
# Python dependencies
pip install -r requirements.txt

# Node.js dependencies
npm install

# Tauri CLI
cargo install tauri-cli
```

## 🚀 Usage

### Development
```bash
# Start backend server
make backend

# Start frontend (in another terminal)
make frontend

# Start full Tauri app
make ui
```

### System Scanning
```bash
# Scan specific directories
make scan

# Generate optimization plan
make plan

# Preview plan (dry run)
make apply

# Execute plan (with confirmation)
make apply-confirm
```

### Testing
```bash
# Run all tests
make test

# Run Python tests only
python -m pytest tests/ -v

# Check licenses
python scripts/check_licenses.py
```

## 🔧 Configuration

### Policy Configuration (`policy.yaml`)
```yaml
version: 1
allowed_actions:
  - send_to_trash
  - move
  - compress
  - ignore
constraints:
  max_batch: 1000
  max_single_delete_bytes: 21474836480  # 20 GB
  require_confirm: true
  quarantine_ttl_days: 7
  protect_paths:
    - "/Windows"
    - "/Program Files"
    - "/usr"
    - "/etc"
```

### AI Configuration
- **Local LLM**: Configure Ollama URL in `backend/ai_assistant.py`
- **API Key**: Set environment variable for external LLM APIs
- **Model**: Default is "llama2", configurable in the assistant

## 📊 JSON Schemas

### Scan Result Schema
```json
{
  "scanned_at": "2025-01-17T10:00:00Z",
  "root": "/",
  "summary": {
    "total_bytes": 1073741824,
    "files": 1000,
    "dirs": 100
  },
  "items": [...],
  "dupes": [...]
}
```

### Action Plan Schema
```json
{
  "generated_at": "2025-01-17T10:00:00Z",
  "actions": [
    {
      "action": "send_to_trash",
      "target": "/tmp/large_file.bin",
      "estimated_savings": 1073741824,
      "risk": "low",
      "reason": "Large temporary file"
    }
  ]
}
```

## 🧪 Testing

### Test Structure
```
tests/
├── test_scanner.py          # Scanner functionality
├── test_engine.py           # Action engine tests
└── test_actionplan_schema.py # Schema validation
```

### Running Tests
```bash
# All tests
make test

# Specific test file
python -m pytest tests/test_scanner.py -v

# With coverage
python -m pytest tests/ --cov=backend
```

## 🔒 Security

### Whitelisted Actions
- `send_to_trash`: Move files to system trash
- `move`: Move files to specified location
- `compress`: Compress files to save space
- `ignore`: Skip action (policy protection)

### Protected Paths
- System directories (`/Windows`, `/usr`, `/etc`)
- Program files directories
- Critical system locations

### Safety Features
- All actions require confirmation
- Automatic backup before destructive actions
- Complete undo system with journal
- Quarantine system with TTL
- No shell command execution

## 🛠️ Development

### Project Structure
```
optiai/
├── backend/                 # Python backend
│   ├── scanner.py          # System scanner
│   ├── analysis_engine.py  # Rule-based analysis
│   ├── ai_assistant.py     # AI integration
│   ├── action_engine.py    # Action execution
│   ├── policy_manager.py   # Policy system
│   ├── engine_flow.py      # Main workflow
│   └── integrations/       # CLI integrations
├── src/                    # React frontend
│   ├── components/         # React components
│   └── App.jsx            # Main app
├── schemas/               # JSON schemas
├── tests/                 # Test suite
├── scripts/               # Development scripts
└── policy.yaml           # Security policy
```

### Adding New Features
1. **Backend**: Add new modules in `backend/`
2. **Frontend**: Add components in `src/components/`
3. **Tests**: Add tests in `tests/`
4. **Schemas**: Update schemas in `schemas/`

### Code Style
- **Python**: Follow PEP 8, use type hints
- **JavaScript**: Use ESLint, Prettier
- **Documentation**: Docstrings for all functions
- **Tests**: Comprehensive test coverage

## 📈 Performance

### Optimization
- **Multithreading**: Configurable worker threads for scanning
- **Caching**: File metadata caching for faster subsequent scans
- **Virtual Lists**: Efficient rendering of large file lists
- **Lazy Loading**: Components loaded on demand

### Benchmarks
- **Scan Speed**: ~1000 files/second on SSD
- **Memory Usage**: <100MB for typical scans
- **Startup Time**: <2 seconds for desktop app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

### Development Setup
```bash
# Install development dependencies
pip install -r requirements-dev.txt
npm install

# Run pre-commit hooks
pre-commit install

# Run full test suite
make test
make lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Czkawka**: Fast duplicate file finder
- **rmlint**: Advanced duplicate detection
- **BleachBit**: System cleanup rules
- **Tauri**: Cross-platform desktop framework
- **React**: Frontend framework
- **Tailwind CSS**: Styling framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/optiai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/optiai/discussions)
- **Documentation**: [Wiki](https://github.com/your-org/optiai/wiki)

---

**OptiAI** - Intelligent system optimization made simple and safe.
