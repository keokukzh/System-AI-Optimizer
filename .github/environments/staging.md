# Staging Environment Configuration

This file documents the required environment variables and secrets for the **staging** environment.

## Required Secrets

### API Keys
- `GITHUB_TOKEN`: GitHub personal access token for API access
- `OLLAMA_HOST`: Ollama server URL

### Build & Deployment
- `TAURI_PRIVATE_KEY`: Private key for Tauri code signing (required)
- `TAURI_KEY_PASSWORD`: Password for Tauri private key (required)

### Apple Signing (macOS builds)
- `APPLE_CERTIFICATE`: Apple Developer certificate (base64 encoded)
- `APPLE_CERTIFICATE_PASSWORD`: Certificate password
- `APPLE_ID`: Apple ID for notarization
- `APPLE_ID_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Apple Developer Team ID

### Database
- `POSTGRES_CONNECTION_STRING`: PostgreSQL connection string
- `MYSQL_CONNECTION_STRING`: MySQL connection string

### Third-party Services
- `CONTEXT7_API_KEY`: Context7 API key
- `GOOGLE_ADS_API_KEY`: Google Ads API key (if using marketing features)
- `FACEBOOK_ADS_API_KEY`: Facebook Ads API key (if using marketing features)

## Environment Variables

### Application Settings
- `NODE_ENV`: "staging"
- `API_PORT`: 5175
- `LOG_LEVEL`: "info"

### Feature Flags
- `ENABLE_AI_FEATURES`: true
- `ENABLE_TELEMETRY`: true
- `ENABLE_AUTO_UPDATES`: true
- `ENABLE_ERROR_REPORTING`: true

### MCP Agent Ports
- `PROJECT_MANAGER_PORT`: 7001
- `DOCKER_ORCHESTRATOR_PORT`: 7002
- `AI_CODEGEN_PORT`: 7003
- `GITHUB_INTEGRATION_PORT`: 7004
- `SECURITY_AUDITOR_PORT`: 7005
- `TEST_SUITE_RUNNER_PORT`: 7006
- `DEPLOYMENT_OPTIMIZER_PORT`: 7007

### Security
- `RATE_LIMIT_REQUESTS`: 100
- `RATE_LIMIT_WINDOW`: 60000
- `SESSION_TIMEOUT`: 3600000
- `REQUIRE_AUTH`: true

## Environment Protection Rules

### Required Reviewers
- Minimum 1 reviewer required for deployments
- Suggested reviewers: Project maintainers

### Wait Timer
- 5 minutes wait before deployment

### Deployment Branches
- Only `develop` and `release/*` branches can deploy to staging

## Setup Instructions

1. Create "staging" environment in GitHub repository settings
2. Add all required secrets
3. Configure environment protection rules
4. Set deployment branch restrictions
5. Add required reviewers

## Notes

- Staging environment mirrors production configuration
- Code signing is required for all builds
- Telemetry and error reporting enabled for testing
- Auto-updates enabled to test update mechanism
- All security features enabled
