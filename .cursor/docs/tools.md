# Cursor Tools Documentation

## Available Tools

### Testing Suite
- **File**: `.cursor/tools/testing-suite.js`
- **Usage**: `node .cursor/tools/testing-suite.js`
- **Description**: Comprehensive testing automation and validation

### Project Management
- **File**: `.cursor/tools/project-management.js`
- **Usage**: `node .cursor/tools/project-management.js init`
- **Description**: Project planning, tracking, and automation

### Security Pro
- **File**: `.cursor/tools/security-pro.js`
- **Usage**: `node .cursor/tools/security-pro.js`
- **Description**: Security scanning and validation

### Performance Optimizer
- **File**: `.cursor/tools/performance-optimizer.js`
- **Usage**: `node .cursor/tools/performance-optimizer.js`
- **Description**: Performance monitoring and optimization

## Workflows

### Development Workflow
- **File**: `.cursor/workflows.json`
- **Description**: Standard development workflow with testing and validation

### AI Optimization Workflow
- **Description**: AI-powered code optimization and suggestions

### Security Workflow
- **Description**: Comprehensive security validation and scanning

### Performance Workflow
- **Description**: Performance monitoring and optimization

## MCP Servers

### Available Servers
- **Filesystem**: File system access and manipulation
- **GitHub**: GitHub integration and API access
- **Fetch**: Web content fetching and processing
- **Playwright**: Browser automation and testing
- **Context7**: Documentation and API reference

## Git Workflow

### Branch Management
- **Feature branches**: `feature/feature-name`
- **Release branches**: `release/version`
- **Hotfix branches**: `hotfix/version`

### Commands
- `node .cursor/automation/git-workflow.js feature <name>`: Create feature branch
- `node .cursor/automation/git-workflow.js release <version>`: Create release branch
- `node .cursor/automation/git-workflow.js commit`: Smart commit with auto-generated message

## Hooks

### Pre-commit Hook
- Runs code formatting checks
- Executes linting
- Runs tests
- Performs security scans
- Validates policy compliance

### Post-commit Hook
- Updates changelog
- Generates commit reports
- Cleans up temporary files
- Updates documentation
- Sends notifications

## Configuration

### Cursor Settings
- **File**: `.cursor/settings.json`
- **Description**: Cursor AI configuration and preferences

### MCP Servers
- **File**: `.cursor/mcp-servers.json`
- **Description**: MCP server configurations and settings

### Agents
- **File**: `.cursor/agents.json`
- **Description**: AI agent configurations and specializations

### Workflows
- **File**: `.cursor/workflows.json`
- **Description**: Workflow definitions and automation rules
