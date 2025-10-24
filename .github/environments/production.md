# Production Environment Configuration

This file documents the required environment variables and secrets for the **production** environment.

## Required Secrets

### API Keys
- `GITHUB_TOKEN`: GitHub personal access token for API access (production scope)
- `OLLAMA_HOST`: Ollama server URL (production instance)

### Build & Deployment (REQUIRED)
- `TAURI_PRIVATE_KEY`: Private key for Tauri code signing
- `TAURI_KEY_PASSWORD`: Password for Tauri private key

### Apple Signing (macOS builds - REQUIRED)
- `APPLE_CERTIFICATE`: Apple Developer certificate (base64 encoded)
- `APPLE_CERTIFICATE_PASSWORD`: Certificate password
- `APPLE_ID`: Apple ID for notarization
- `APPLE_ID_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Apple Developer Team ID

### Database (REQUIRED)
- `POSTGRES_CONNECTION_STRING`: PostgreSQL connection string (production)
- `MYSQL_CONNECTION_STRING`: MySQL connection string (production)

### Third-party Services
- `CONTEXT7_API_KEY`: Context7 API key
- `GOOGLE_ADS_API_KEY`: Google Ads API key
- `FACEBOOK_ADS_API_KEY`: Facebook Ads API key

### Security & Monitoring
- `SENTRY_DSN`: Sentry error tracking DSN
- `DATADOG_API_KEY`: DataDog monitoring API key
- `ENCRYPTION_KEY`: Application encryption key (AES-256)
- `JWT_SECRET`: JWT signing secret

## Environment Variables

### Application Settings
- `NODE_ENV`: "production"
- `API_PORT`: 5175
- `LOG_LEVEL`: "warn"
- `DEBUG`: false

### Feature Flags
- `ENABLE_AI_FEATURES`: true
- `ENABLE_TELEMETRY`: true
- `ENABLE_AUTO_UPDATES`: true
- `ENABLE_ERROR_REPORTING`: true
- `ENABLE_ANALYTICS`: true

### MCP Agent Ports
- `PROJECT_MANAGER_PORT`: 7001
- `DOCKER_ORCHESTRATOR_PORT`: 7002
- `AI_CODEGEN_PORT`: 7003
- `GITHUB_INTEGRATION_PORT`: 7004
- `SECURITY_AUDITOR_PORT`: 7005
- `TEST_SUITE_RUNNER_PORT`: 7006
- `DEPLOYMENT_OPTIMIZER_PORT`: 7007

### Security (Strict Production Settings)
- `RATE_LIMIT_REQUESTS`: 50
- `RATE_LIMIT_WINDOW`: 60000
- `SESSION_TIMEOUT`: 1800000 (30 minutes)
- `REQUIRE_AUTH`: true
- `ENABLE_2FA`: true
- `CORS_ALLOWED_ORIGINS`: ["https://optiai.app"]

### Performance
- `CACHE_ENABLED`: true
- `CACHE_TTL`: 3600
- `MAX_WORKERS`: 4
- `REQUEST_TIMEOUT`: 30000

## Environment Protection Rules

### Required Reviewers
- Minimum 2 reviewers required for deployments
- Required reviewers: Repository administrators and release managers

### Wait Timer
- 30 minutes wait before deployment
- Allows time for final checks and stakeholder notification

### Deployment Branches
- **ONLY** `main` branch can deploy to production
- Tag-based releases (v*) trigger automatic production deployment

### Approval Requirements
- Manual approval required from:
  - Technical Lead
  - Security Team
  - Product Owner

## Setup Instructions

1. Create "production" environment in GitHub repository settings
2. Add all required secrets with production values
3. Configure strict environment protection rules:
   - Add required reviewers (minimum 2)
   - Set deployment branch to `main` only
   - Enable wait timer (30 minutes)
   - Require manual approval
4. Set up deployment notifications
5. Configure rollback procedures

## Security Checklist

- [ ] All secrets are unique production values (not dev/staging)
- [ ] Code signing certificates are valid and not expired
- [ ] Database credentials use read-only user for analytics
- [ ] API keys have appropriate rate limits
- [ ] Encryption keys are strong (256-bit minimum)
- [ ] All third-party integrations use production endpoints
- [ ] Error reporting configured to redact sensitive data
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery plan in place
- [ ] Rollback procedures documented and tested

## Deployment Process

1. Create release tag (vX.Y.Z) on `main` branch
2. GitHub Actions automatically builds all platform artifacts
3. Wait timer activates (30 minutes)
4. Required reviewers approve deployment
5. Artifacts are signed and notarized
6. Release is published to GitHub Releases
7. Docker images pushed to container registry
8. Auto-update notifications sent to users
9. Monitoring dashboards updated
10. Stakeholders notified of successful deployment

## Rollback Procedures

If issues are detected after deployment:

1. Immediately create hotfix tag from previous stable version
2. Trigger emergency deployment workflow
3. Notify all users of the rollback
4. Investigate and document the issue
5. Prepare fix for next release

## Notes

- Production environment has the strictest security settings
- All deployments require multiple approvals
- Code signing is mandatory for all builds
- Telemetry, error reporting, and analytics are all enabled
- Auto-updates are enabled to ensure users get critical fixes
- 30-minute wait timer allows for final validation
- Only `main` branch deployments are allowed
- All production secrets must be rotated quarterly
