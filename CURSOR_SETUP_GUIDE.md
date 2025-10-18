# Cursor Tools & Workflows Setup Guide

This guide will help you set up and use the comprehensive Cursor tools and workflows that have been implemented for the OptiAI project.

## 🚀 Quick Setup

Run the automated setup script to install and configure everything:

```bash
node .cursor/setup.js
```

This will:
- Check prerequisites (Node.js, npm, Git, Python, Rust)
- Install all dependencies
- Set up MCP servers
- Configure Git hooks
- Set up workflows
- Create templates
- Generate documentation

## 📋 What's Included

### 🔧 Core Tools

1. **Testing Suite** (`.cursor/tools/testing-suite.js`)
   - Comprehensive test automation
   - Unit, integration, E2E, security, and performance tests
   - Coverage reporting and analysis

2. **Project Management** (`.cursor/tools/project-management.js`)
   - Project analysis and planning
   - Task management and tracking
   - Progress monitoring and reporting

3. **Security Pro** (`.cursor/tools/security-pro.js`)
   - Vulnerability scanning
   - Policy compliance validation
   - Secrets detection
   - Security recommendations

4. **Performance Optimizer** (`.cursor/tools/performance-optimizer.js`)
   - Bundle size analysis
   - Code performance optimization
   - Dependency optimization
   - Runtime performance monitoring

### 🔌 MCP Servers

Configured MCP servers for extended functionality:

- **Filesystem**: File system access and manipulation
- **GitHub**: GitHub integration and API access
- **Fetch**: Web content fetching and processing
- **Playwright**: Browser automation and testing
- **Context7**: Documentation and API reference
- **Memory**: Context and memory management
- **Database**: PostgreSQL and MySQL integration
- **DeepGraph**: React, Vue, and Next.js integration
- **Marketing**: Google Ads and Facebook Ads integration

### 🤖 AI Agents

Pre-configured AI agents for different specializations:

- **Development Team**: Frontend, Backend, Fullstack, Mobile, DevOps
- **Development Tools**: Code Reviewer, Debugger, Test Engineer, MCP Expert
- **AI Specialists**: Prompt Engineer, Task Decomposition Expert
- **Expert Advisors**: Architecture Reviewer
- **Programming Languages**: JavaScript Pro, Python Pro
- **Data & AI**: AI Engineer
- **DevOps & Infrastructure**: Deployment Engineer
- **Documentation**: API Documenter

### 🔄 Workflows

Automated workflows for different scenarios:

1. **Development Workflow**
   - Pre-commit hooks (linting, testing, security)
   - Build validation
   - Test execution
   - Deployment preparation

2. **AI Optimization Workflow**
   - Code analysis
   - Optimization suggestions
   - Auto-refactoring
   - Performance improvements

3. **Security Workflow**
   - Vulnerability scanning
   - Policy compliance
   - Security reporting

4. **Performance Workflow**
   - Performance monitoring
   - Bottleneck analysis
   - Auto-optimization

### 🪝 Git Hooks

Automated Git operations:

- **Pre-commit**: Code formatting, linting, testing, security checks
- **Post-commit**: Changelog updates, documentation, notifications
- **Smart commits**: Auto-generated commit messages
- **Branch management**: Feature, release, and hotfix branches

## 🛠️ Usage Examples

### Daily Development Workflow

```bash
# 1. Create a new feature branch
node .cursor/automation/git-workflow.js feature my-new-feature

# 2. Make your changes, then commit with auto-generated message
node .cursor/automation/git-workflow.js commit

# 3. Run comprehensive tests
node .cursor/tools/testing-suite.js

# 4. Check for security issues
node .cursor/tools/security-pro.js

# 5. Optimize performance
node .cursor/tools/performance-optimizer.js

# 6. Finish the feature
node .cursor/automation/git-workflow.js finish-feature my-new-feature
```

### Project Management

```bash
# Initialize project management
node .cursor/tools/project-management.js init

# Generate project status report
node .cursor/tools/project-management.js report

# Create a new task
node .cursor/tools/project-management.js task feature
```

### Workflow Orchestration

```bash
# List available workflows
node .cursor/automation/workflow-orchestrator.js list

# Execute a specific workflow
node .cursor/automation/workflow-orchestrator.js execute development

# Check workflow status
node .cursor/automation/workflow-orchestrator.js status <workflow-id>
```

### MCP Server Management

```bash
# Start all MCP servers
.cursor/start-mcp-servers.sh

# Or start individual servers
npx @modelcontextprotocol/server-filesystem
npx @modelcontextprotocol/server-github
npx @modelcontextprotocol/server-fetch
npx @modelcontextprotocol/server-playwright
```

## 📁 File Structure

```
.cursor/
├── settings.json              # Cursor AI configuration
├── workflows.json             # Workflow definitions
├── mcp-servers.json          # MCP server configurations
├── agents.json               # AI agent configurations
├── setup.js                  # Setup script
├── start-mcp-servers.sh      # MCP server startup script
├── tools/                    # Development tools
│   ├── testing-suite.js
│   ├── project-management.js
│   ├── security-pro.js
│   └── performance-optimizer.js
├── automation/               # Automation scripts
│   ├── workflow-orchestrator.js
│   └── git-workflow.js
├── hooks/                    # Git hooks
│   ├── pre-commit.js
│   └── post-commit.js
├── templates/                # Code templates
│   ├── component.jsx
│   ├── test.js
│   └── api.py
└── docs/                     # Documentation
    ├── tools.md
    └── quick-start.md
```

## 🔧 Configuration

### Environment Variables

Set these environment variables for full functionality:

```bash
# GitHub integration
export GITHUB_TOKEN="your_github_token"

# Context7 documentation
export CONTEXT7_API_KEY="your_context7_key"

# Database connections
export POSTGRES_CONNECTION_STRING="postgresql://..."
export MYSQL_CONNECTION_STRING="mysql://..."

# Marketing integrations
export GOOGLE_ADS_API_KEY="your_google_ads_key"
export FACEBOOK_ADS_API_KEY="your_facebook_ads_key"
```

### Cursor Settings

The `.cursor/settings.json` file contains:
- AI model configuration
- Feature toggles
- Context settings
- Security preferences
- Performance monitoring
- Integration settings

### MCP Server Configuration

The `.cursor/mcp-servers.json` file defines:
- Server commands and arguments
- Environment variables
- Security settings
- Workflow associations

## 🚨 Troubleshooting

### Common Issues

1. **MCP servers not starting**
   - Check if required packages are installed globally
   - Verify environment variables are set
   - Check server logs in `.cursor/mcp-servers.log`

2. **Git hooks not working**
   - Ensure hooks are executable: `chmod +x .git/hooks/*`
   - Check if Node.js is in PATH
   - Verify hook scripts exist in `.cursor/hooks/`

3. **Tests failing**
   - Check if all dependencies are installed
   - Verify test configuration files exist
   - Run tests individually to isolate issues

4. **Security scans failing**
   - Check if policy.yaml exists and is valid
   - Verify required security tools are installed
   - Check file permissions

### Getting Help

1. Check the generated documentation in `.cursor/docs/`
2. Review the setup log from `node .cursor/setup.js`
3. Check individual tool help: `node .cursor/tools/<tool-name>.js --help`
4. Review workflow configurations in `.cursor/workflows.json`

## 🔄 Updates and Maintenance

### Updating Tools

```bash
# Re-run setup to update dependencies
node .cursor/setup.js

# Update individual tools
npm update -g @modelcontextprotocol/server-*
```

### Adding New Workflows

1. Edit `.cursor/workflows.json`
2. Add workflow definition
3. Create any required scripts
4. Test the workflow

### Customizing Agents

1. Edit `.cursor/agents.json`
2. Modify agent configurations
3. Add new specializations
4. Update agent prompts

## 📊 Monitoring and Reporting

### Generated Reports

The tools generate various reports:
- `test-report.json` - Test results and coverage
- `security-report.json` - Security scan results
- `performance-report.json` - Performance analysis
- `status-report.json` - Project status

### Workflow History

Workflow execution history is maintained in:
- Active workflows: `.cursor/workflows/active/`
- Completed workflows: `.cursor/workflows/history/`

## 🎯 Best Practices

1. **Regular Testing**: Run the testing suite before each commit
2. **Security First**: Always run security scans before deployment
3. **Performance Monitoring**: Use performance optimizer regularly
4. **Documentation**: Keep documentation updated with changes
5. **Workflow Automation**: Use workflows for repetitive tasks
6. **Git Hygiene**: Use smart commits and proper branch management

## 🔮 Advanced Features

### Custom Workflows

Create custom workflows by editing `.cursor/workflows.json`:

```json
{
  "workflows": {
    "my-custom-workflow": {
      "name": "My Custom Workflow",
      "description": "Custom workflow for specific needs",
      "steps": [
        {
          "name": "custom-step",
          "type": "command",
          "actions": ["npm run custom-command"]
        }
      ]
    }
  }
}
```

### Agent Collaboration

Configure multiple agents to work together:

```json
{
  "agentConfig": {
    "collaborationMode": true,
    "contextSharing": true,
    "skillMatching": true
  }
}
```

### Automated Scheduling

Schedule workflows to run automatically:

```bash
node .cursor/automation/workflow-orchestrator.js schedule development "0 9 * * 1-5"
```

This comprehensive setup provides you with a powerful development environment that integrates AI assistance, automated workflows, comprehensive testing, security scanning, and performance optimization - all tailored specifically for the OptiAI project.
