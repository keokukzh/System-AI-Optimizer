# Quick Start Guide

## Initial Setup

1. **Run setup script**:
   ```bash
   node .cursor/setup.js
   ```

2. **Start MCP servers**:
   ```bash
   .cursor/start-mcp-servers.sh
   ```

3. **Initialize project management**:
   ```bash
   node .cursor/tools/project-management.js init
   ```

## Daily Workflow

1. **Create feature branch**:
   ```bash
   node .cursor/automation/git-workflow.js feature my-feature
   ```

2. **Make changes and commit**:
   ```bash
   node .cursor/automation/git-workflow.js commit
   ```

3. **Run tests**:
   ```bash
   node .cursor/tools/testing-suite.js
   ```

4. **Check security**:
   ```bash
   node .cursor/tools/security-pro.js
   ```

5. **Optimize performance**:
   ```bash
   node .cursor/tools/performance-optimizer.js
   ```

6. **Finish feature**:
   ```bash
   node .cursor/automation/git-workflow.js finish-feature my-feature
   ```

## Useful Commands

- **List workflows**: `node .cursor/automation/workflow-orchestrator.js list`
- **Execute workflow**: `node .cursor/automation/workflow-orchestrator.js execute development`
- **Project status**: `node .cursor/tools/project-management.js report`
- **Git status**: `node .cursor/automation/git-workflow.js status`
