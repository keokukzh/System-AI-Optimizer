# Development Environment Configuration

This file documents the required environment variables and secrets for the **development** environment.

## Required Secrets

### API Keys
- `GITHUB_TOKEN`: GitHub personal access token for API access
- `OLLAMA_HOST`: Ollama server URL (default: http://127.0.0.1:11434)

### Build & Deployment
- `TAURI_PRIVATE_KEY`: Private key for Tauri code signing (optional in dev)
- `TAURI_KEY_PASSWORD`: Password for Tauri private key (optional in dev)

### Database (Optional)
- `POSTGRES_CONNECTION_STRING`: PostgreSQL connection string (if using database)
- `MYSQL_CONNECTION_STRING`: MySQL connection string (if using database)

## Environment Variables

### Application Settings
- `NODE_ENV`: "development"
- `API_PORT`: 5175
- `VITE_PORT`: 3001
- `LOG_LEVEL`: "debug"

### Feature Flags
- `ENABLE_AI_FEATURES`: true
- `ENABLE_TELEMETRY`: false
- `ENABLE_AUTO_UPDATES`: false

### MCP Agent Ports
- `PROJECT_MANAGER_PORT`: 7001
- `DOCKER_ORCHESTRATOR_PORT`: 7002
- `AI_CODEGEN_PORT`: 7003
- `GITHUB_INTEGRATION_PORT`: 7004
- `SECURITY_AUDITOR_PORT`: 7005
- `TEST_SUITE_RUNNER_PORT`: 7006
- `DEPLOYMENT_OPTIMIZER_PORT`: 7007

## Setup Instructions

1. Create environment in GitHub repository settings
2. Add all required secrets
3. Configure environment protection rules (optional for dev)
4. Set environment variables

## Notes

- Development environment has relaxed security for easier testing
- Auto-deployment disabled by default
- Debug logging enabled
- All features are accessible without restrictions
