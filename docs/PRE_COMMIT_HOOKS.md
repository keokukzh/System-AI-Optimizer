# Pre-commit Hooks for OptiAI

This document describes optional pre-commit hooks you can use to maintain code quality and prevent common issues.

## Installation

### 1. Install pre-commit

```bash
# Using pip
pip install pre-commit

# Or using your package manager
# macOS (Homebrew)
brew install pre-commit

# Ubuntu/Debian
sudo apt install pre-commit
```

### 2. Install hooks in your repository

```bash
cd /path/to/System-AI-Optimizer
pre-commit install
```

## Available Hooks Configuration

Create a `.pre-commit-config.yaml` file in the repository root:

```yaml
repos:
  # General file checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-toml
      - id: check-added-large-files
        args: ['--maxkb=5000']
      - id: check-merge-conflict
      - id: detect-private-key
      - id: mixed-line-ending

  # Python formatting and linting
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.11
        files: '^backend/.*\.py$'

  - repo: https://github.com/PyCQA/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        files: '^backend/.*\.py$'
        args: ['--max-line-length=120', '--ignore=E203,W503']

  # JavaScript/TypeScript formatting
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        files: '\.(js|jsx|ts|tsx|json|css|md|yaml|yml)$'
        exclude: '^(package-lock\.json|node_modules/)'

  # Rust formatting
  - repo: https://github.com/doublify/pre-commit-rust
    rev: v1.0
    hooks:
      - id: fmt
        args: ['--manifest-path', 'src-tauri/Cargo.toml']
      - id: clippy
        args: ['--manifest-path', 'src-tauri/Cargo.toml', '--', '-D', 'warnings']

  # Security checks
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: 'package-lock.json'
```

## Running Hooks Manually

### Run all hooks on all files

```bash
pre-commit run --all-files
```

### Run specific hook

```bash
pre-commit run black --all-files
pre-commit run prettier --all-files
```

### Run on staged files only

```bash
pre-commit run
```

## Custom Hook: Pre-build Check

Add a custom hook to run the pre-build validation script:

```yaml
  # Custom pre-build checks
  - repo: local
    hooks:
      - id: pre-build-check
        name: Pre-build Validation
        entry: python scripts/pre_build_check.py
        language: system
        pass_filenames: false
        stages: [commit]

      - id: license-check
        name: License Compliance Check
        entry: python scripts/check_licenses.py
        language: system
        pass_filenames: false
        stages: [commit]
```

## Bypassing Hooks

If you need to bypass hooks in an emergency (not recommended):

```bash
git commit --no-verify -m "Emergency fix"
```

## Best Practices

1. **Install hooks immediately** after cloning the repository
2. **Run `pre-commit run --all-files`** before creating a PR
3. **Keep hooks updated**: Run `pre-commit autoupdate` periodically
4. **Don't bypass hooks** unless absolutely necessary
5. **Add new checks** as the project grows

## Hook Configuration by File Type

### Python Files
- **black**: Auto-formatting with 120 char line length
- **flake8**: Linting with E203, W503 ignored
- **detect-secrets**: Prevent accidental secret commits

### JavaScript/TypeScript
- **prettier**: Consistent formatting
- **eslint**: Would require `.eslintrc` configuration

### Rust
- **rustfmt**: Format code
- **clippy**: Linting with warnings as errors

### JSON/YAML
- **check-json**: Syntax validation
- **check-yaml**: Syntax validation
- **prettier**: Formatting

## Troubleshooting

### Hook fails on Windows
Some hooks may need WSL or Git Bash on Windows.

### Hook is slow
Hooks run on all files can be slow. Consider:
- Running only on changed files (default)
- Excluding large directories
- Using faster alternatives

### Python import errors
Make sure your virtual environment is activated:
```bash
cd backend
source .venv/bin/activate  # Unix
.venv\Scripts\activate     # Windows
```

## Integration with CI

The CI workflow already runs many of these checks. Pre-commit hooks:
- **Catch issues early** (before pushing)
- **Speed up CI** (fewer failures)
- **Improve code quality** (consistent formatting)

## Optional: Skip hooks for documentation changes

Add to `.pre-commit-config.yaml`:

```yaml
exclude: '^(docs/|\.md$|README)'
```

## More Information

- [Pre-commit documentation](https://pre-commit.com/)
- [Available hooks](https://pre-commit.com/hooks.html)
- [Creating custom hooks](https://pre-commit.com/#creating-new-hooks)
