# CI/CD Pipeline Documentation

This document describes the comprehensive CI/CD pipeline for OptiAI, including build, test, security, and release workflows.

## Overview

The CI/CD pipeline is built on GitHub Actions and includes:

1. **Continuous Integration (CI)** - Automated testing and validation
2. **Release Workflow** - Tag-based release automation
3. **Security Scanning** - Automated vulnerability detection
4. **Multi-Platform Builds** - Windows, macOS, and Linux support
5. **Environment Management** - Dev, Staging, and Production environments

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main`

**Jobs**:

#### Test Job
- Runs on: `ubuntu-latest`, `windows-latest`, `macos-latest`
- Python versions: `3.11`, `3.12`
- Node.js versions: `18`, `20`

**Steps**:
1. Checkout code
2. Setup Python, Node.js, and Rust
3. Cache dependencies (pip, npm, cargo)
4. Install dependencies
5. Run Python tests with coverage
6. Run Node.js tests
7. Run Rust tests
8. Run license check
9. Upload coverage reports to Codecov

#### Build Job
- Runs after test job passes
- Runs on all platforms
- Python: `3.11`, Node.js: `18`

**Steps**:
1. Setup all required tools
2. Install dependencies
3. Build frontend
4. Build Tauri desktop app
5. Upload build artifacts

#### Release Job
- Runs on: `ubuntu-latest`
- Condition: Push to `main` branch only

**Steps**:
1. Download build artifacts
2. Create GitHub release
3. Attach artifacts to release

#### Security Job
- Runs independently on: `ubuntu-latest`

**Steps**:
1. Run Python security audit (safety)
2. Run npm security audit
3. Run Rust security audit (cargo-audit)
4. Run Trivy vulnerability scanner
5. Upload SARIF results to GitHub Security

### 2. Release Workflow (`release.yml`)

**Trigger**: Git tags matching `v*` (e.g., `v1.0.0`)

**Jobs**:

#### Create Release
- Creates GitHub release with version info
- Generates release notes from CHANGELOG.md

#### Build Release
- Matrix build for all platforms:
  - Windows (x64)
  - macOS (x64, ARM64)
  - Linux (x64)

**Steps**:
1. Setup environment
2. Install system dependencies
3. Build frontend and Tauri app
4. Package platform-specific artifacts
5. Generate SHA256 checksums
6. Upload to GitHub Release

#### Sign and Notarize (macOS)
- Apple code signing
- App notarization
- Requires: Apple Developer credentials

#### Docker Release
- Build multi-platform Docker images
- Push to GitHub Container Registry (ghcr.io)
- Tags: semver versions + latest

#### Publish Release
- Updates release with full notes
- Attaches all platform artifacts

## GitHub Environments

### Development Environment

**Purpose**: Active development and testing

**Configuration**:
- `NODE_ENV`: "development"
- `LOG_LEVEL`: "debug"
- `ENABLE_TELEMETRY`: false

**Protection Rules**:
- None (open access for developers)

**Required Secrets**:
- `GITHUB_TOKEN`
- `OLLAMA_HOST` (optional)

### Staging Environment

**Purpose**: Pre-production testing and validation

**Configuration**:
- `NODE_ENV`: "staging"
- `LOG_LEVEL`: "info"
- `ENABLE_TELEMETRY`: true
- `ENABLE_AUTO_UPDATES`: true

**Protection Rules**:
- Minimum 1 reviewer required
- 5-minute wait timer
- Only `develop` and `release/*` branches

**Required Secrets**:
- All development secrets
- `TAURI_PRIVATE_KEY` (required)
- `TAURI_KEY_PASSWORD` (required)
- Apple signing credentials
- Database connection strings

### Production Environment

**Purpose**: Live production deployments

**Configuration**:
- `NODE_ENV`: "production"
- `LOG_LEVEL`: "warn"
- `DEBUG`: false
- All security features enabled

**Protection Rules**:
- Minimum 2 reviewers required
- 30-minute wait timer
- **ONLY** `main` branch allowed
- Manual approval required

**Required Secrets**:
- All staging secrets
- Production database credentials
- Error tracking (Sentry)
- Monitoring (DataDog)
- Encryption keys
- JWT secrets

## Dependabot Configuration

**File**: `.github/dependabot.yml`

**Ecosystems Monitored**:
1. npm (Node.js dependencies)
2. pip (Python dependencies)
3. cargo (Rust dependencies)
4. github-actions (Workflow dependencies)

**Update Schedule**: Weekly

**Features**:
- Automatic dependency updates
- Security vulnerability fixes
- Pull request creation for updates

## Release Process

### 1. Prepare Release

```bash
# Update version in package.json, Cargo.toml, etc.
# Update CHANGELOG.md with release notes

# Commit changes
git add .
git commit -m "chore: prepare release v1.2.3"
git push origin main
```

### 2. Create Release Tag

```bash
# Create annotated tag
git tag -a v1.2.3 -m "Release version 1.2.3"

# Push tag to trigger release workflow
git push origin v1.2.3
```

### 3. Automated Build & Release

The release workflow automatically:
1. Creates GitHub release
2. Builds for all platforms
3. Signs code (macOS, Windows)
4. Generates checksums
5. Publishes Docker images
6. Attaches artifacts to release

### 4. Manual Verification

After automated release:
1. Download and test artifacts
2. Verify checksums
3. Test auto-update mechanism
4. Monitor error reports

### 5. Post-Release

- Announce release on social media
- Update documentation
- Monitor user feedback
- Track metrics

## Security Best Practices

### Secrets Management

1. **Never commit secrets** to repository
2. Use GitHub Secrets for sensitive data
3. Rotate secrets quarterly
4. Use environment-specific secrets

### Code Signing

1. **Windows**: Use code signing certificate
2. **macOS**: Apple Developer certificate + notarization
3. **Linux**: GPG signing (optional)

### Dependency Security

1. Run `npm audit` regularly
2. Use Dependabot for updates
3. Review security advisories
4. Pin critical dependencies

## Monitoring & Alerts

### Build Status

- GitHub Actions status badges
- Email notifications on failure
- Slack/Discord webhooks

### Security Alerts

- Dependabot security alerts
- Trivy vulnerability reports
- CodeQL scanning results

## Troubleshooting

### Build Failures

1. Check GitHub Actions logs
2. Verify all secrets are set
3. Check for dependency conflicts
4. Test locally with same versions

### Release Failures

1. Verify tag format (`v*`)
2. Check code signing credentials
3. Ensure all tests pass
4. Verify artifact generation

### Deployment Issues

1. Check environment protection rules
2. Verify required approvals
3. Check deployment logs
4. Verify secrets are set correctly

## Performance Optimization

### Caching Strategy

- **npm**: Cache `~/.npm`
- **pip**: Cache `~/.cache/pip`
- **cargo**: Cache `~/.cargo` and `target/`

### Parallel Execution

- Test jobs run in parallel across platforms
- Build jobs run in parallel after tests
- Security scans run independently

### Artifact Management

- Compress artifacts before upload
- Clean old artifacts periodically
- Use artifact retention policies

## Future Improvements

- [ ] Add performance benchmarking
- [ ] Implement canary deployments
- [ ] Add smoke tests to release workflow
- [ ] Integrate with project management tools
- [ ] Add automated rollback on failure
- [ ] Implement blue-green deployments
- [ ] Add infrastructure as code
- [ ] Set up monitoring dashboards

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Tauri Build Guide](https://tauri.app/v1/guides/building/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Code Signing Guide](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

## Support

For issues with CI/CD:
1. Check GitHub Actions logs
2. Review this documentation
3. Search existing issues
4. Create new issue with logs and details
