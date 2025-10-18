#!/usr/bin/env node

/**
 * Cursor Tools Setup Script for OptiAI
 * Installs and configures all Cursor tools and workflows
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CursorSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.setupLog = [];
  }

  /**
   * Run complete setup
   */
  async run() {
    console.log('🚀 Setting up Cursor tools and workflows for OptiAI...\n');
    
    try {
      await this.checkPrerequisites();
      await this.installDependencies();
      await this.setupMCP();
      await this.setupGitHooks();
      await this.setupWorkflows();
      await this.createTemplates();
      await this.generateDocumentation();
      
      console.log('\n✅ Cursor setup completed successfully!');
      this.printSummary();
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    const prerequisites = [
      { name: 'Node.js', command: 'node --version', required: true },
      { name: 'npm', command: 'npm --version', required: true },
      { name: 'Git', command: 'git --version', required: true },
      { name: 'Python', command: 'python --version', required: true },
      { name: 'Rust', command: 'rustc --version', required: false }
    ];

    for (const prereq of prerequisites) {
      try {
        const version = execSync(prereq.command, { encoding: 'utf8' }).trim();
        console.log(`  ✅ ${prereq.name}: ${version}`);
        this.setupLog.push(`✅ ${prereq.name}: ${version}`);
      } catch (error) {
        if (prereq.required) {
          console.error(`  ❌ ${prereq.name}: Not found`);
          throw new Error(`${prereq.name} is required but not installed`);
        } else {
          console.warn(`  ⚠️  ${prereq.name}: Not found (optional)`);
          this.setupLog.push(`⚠️  ${prereq.name}: Not found (optional)`);
        }
      }
    }
  }

  /**
   * Install dependencies
   */
  async installDependencies() {
    console.log('\n📦 Installing dependencies...');
    
    try {
      // Install Node.js dependencies
      if (fs.existsSync('package.json')) {
        console.log('  📦 Installing Node.js dependencies...');
        execSync('npm install', { cwd: this.projectRoot });
        console.log('  ✅ Node.js dependencies installed');
        this.setupLog.push('✅ Node.js dependencies installed');
      }

      // Install Python dependencies
      if (fs.existsSync('backend/requirements.txt')) {
        console.log('  🐍 Installing Python dependencies...');
        try {
          execSync('cd backend && pip install -r requirements.txt', { cwd: this.projectRoot });
          console.log('  ✅ Python dependencies installed');
          this.setupLog.push('✅ Python dependencies installed');
        } catch (error) {
          console.warn('  ⚠️  Python dependencies installation failed:', error.message);
          this.setupLog.push('⚠️  Python dependencies installation failed');
        }
      }

      // Install Rust dependencies
      if (fs.existsSync('src-tauri/Cargo.toml')) {
        console.log('  🦀 Installing Rust dependencies...');
        try {
          execSync('cd src-tauri && cargo build', { cwd: this.projectRoot });
          console.log('  ✅ Rust dependencies installed');
          this.setupLog.push('✅ Rust dependencies installed');
        } catch (error) {
          console.warn('  ⚠️  Rust dependencies installation failed:', error.message);
          this.setupLog.push('⚠️  Rust dependencies installation failed');
        }
      }
    } catch (error) {
      console.error('  ❌ Dependency installation failed:', error.message);
      throw error;
    }
  }

  /**
   * Setup MCP servers
   */
  async setupMCP() {
    console.log('\n🔌 Setting up MCP servers...');
    
    try {
      // Install MCP server dependencies
      const mcpPackages = [
        '@modelcontextprotocol/server-filesystem',
        '@modelcontextprotocol/server-github'
      ];

      for (const pkg of mcpPackages) {
        try {
          console.log(`  📦 Installing ${pkg}...`);
          execSync(`npm install -g ${pkg}`, { cwd: this.projectRoot });
          console.log(`  ✅ ${pkg} installed`);
          this.setupLog.push(`✅ ${pkg} installed`);
        } catch (error) {
          console.warn(`  ⚠️  Could not install ${pkg}:`, error.message);
          this.setupLog.push(`⚠️  Could not install ${pkg}`);
        }
      }

      // Create MCP server startup script
      const mcpScript = `#!/bin/bash
# MCP Server Startup Script for OptiAI

echo "🚀 Starting MCP servers..."

# Start filesystem server
npx @modelcontextprotocol/server-filesystem &
echo "📁 Filesystem server started"

# Start GitHub server (if token available)
if [ ! -z "$GITHUB_TOKEN" ]; then
  npx @modelcontextprotocol/server-github &
  echo "🐙 GitHub server started"
fi

echo "✅ MCP servers started"
`;

      const mcpScriptPath = path.join(this.projectRoot, '.cursor', 'start-mcp-servers.sh');
      fs.writeFileSync(mcpScriptPath, mcpScript);
      fs.chmodSync(mcpScriptPath, '755');

      console.log('  ✅ MCP servers configured');
      this.setupLog.push('✅ MCP servers configured');
    } catch (error) {
      console.error('  ❌ MCP setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Setup Git hooks
   */
  async setupGitHooks() {
    console.log('\n🪝 Setting up Git hooks...');
    
    try {
      const gitWorkflowPath = path.join(this.projectRoot, '.cursor', 'automation', 'git-workflow.js');
      if (fs.existsSync(gitWorkflowPath)) {
        execSync(`node "${gitWorkflowPath}" init`, { cwd: this.projectRoot });
        console.log('  ✅ Git hooks configured');
        this.setupLog.push('✅ Git hooks configured');
      } else {
        console.warn('  ⚠️  Git workflow script not found');
        this.setupLog.push('⚠️  Git workflow script not found');
      }
    } catch (error) {
      console.warn('  ⚠️  Git hooks setup failed:', error.message);
      this.setupLog.push('⚠️  Git hooks setup failed');
    }
  }

  /**
   * Setup workflows
   */
  async setupWorkflows() {
    console.log('\n🔄 Setting up workflows...');
    
    try {
      // Make workflow scripts executable
      const workflowScripts = [
        '.cursor/tools/testing-suite.js',
        '.cursor/tools/project-management.js',
        '.cursor/tools/security-pro.js',
        '.cursor/tools/performance-optimizer.js',
        '.cursor/automation/workflow-orchestrator.js'
      ];

      for (const script of workflowScripts) {
        const scriptPath = path.join(this.projectRoot, script);
        if (fs.existsSync(scriptPath)) {
          fs.chmodSync(scriptPath, '755');
          console.log(`  ✅ Made executable: ${script}`);
        }
      }

      console.log('  ✅ Workflows configured');
      this.setupLog.push('✅ Workflows configured');
    } catch (error) {
      console.warn('  ⚠️  Workflow setup failed:', error.message);
      this.setupLog.push('⚠️  Workflow setup failed');
    }
  }

  /**
   * Create templates
   */
  async createTemplates() {
    console.log('\n📝 Creating templates...');
    
    try {
      const templatesDir = path.join(this.projectRoot, '.cursor', 'templates');
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }

      // Create component template
      const componentTemplate = `import React from 'react';

/**
 * {{ComponentName}} Component
 * {{Description}}
 */
const {{ComponentName}} = ({ {{props}} }) => {
  return (
    <div className="{{componentName}}">
      {/* Component content */}
    </div>
  );
};

export default {{ComponentName}};
`;

      fs.writeFileSync(path.join(templatesDir, 'component.jsx'), componentTemplate);

      // Create test template
      const testTemplate = `import { render, screen } from '@testing-library/react';
import {{ComponentName}} from './{{ComponentName}}';

describe('{{ComponentName}}', () => {
  it('renders correctly', () => {
    render(<{{ComponentName}} />);
    // Add test assertions
  });
});
`;

      fs.writeFileSync(path.join(templatesDir, 'test.js'), testTemplate);

      // Create API endpoint template
      const apiTemplate = `from fastapi import APIRouter, HTTPException
from typing import List, Optional

router = APIRouter(prefix="/api/{{endpoint}}", tags=["{{endpoint}}"])

@router.get("/")
async def get_{{endpoint}}():
    """Get all {{endpoint}} items"""
    try:
        # Implementation here
        return {"message": "{{endpoint}} endpoint"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_{{endpoint}}(data: dict):
    """Create new {{endpoint}} item"""
    try:
        # Implementation here
        return {"message": "{{endpoint}} created", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
`;

      fs.writeFileSync(path.join(templatesDir, 'api.py'), apiTemplate);

      console.log('  ✅ Templates created');
      this.setupLog.push('✅ Templates created');
    } catch (error) {
      console.warn('  ⚠️  Template creation failed:', error.message);
      this.setupLog.push('⚠️  Template creation failed');
    }
  }

  /**
   * Generate documentation
   */
  async generateDocumentation() {
    console.log('\n📚 Generating documentation...');
    
    try {
      const docsDir = path.join(this.projectRoot, '.cursor', 'docs');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      // Create tools documentation
      const toolsDoc = `# Cursor Tools Documentation

## Available Tools

### Testing Suite
- **File**: \`.cursor/tools/testing-suite.js\`
- **Usage**: \`node .cursor/tools/testing-suite.js\`
- **Description**: Comprehensive testing automation and validation

### Project Management
- **File**: \`.cursor/tools/project-management.js\`
- **Usage**: \`node .cursor/tools/project-management.js init\`
- **Description**: Project planning, tracking, and automation

### Security Pro
- **File**: \`.cursor/tools/security-pro.js\`
- **Usage**: \`node .cursor/tools/security-pro.js\`
- **Description**: Security scanning and validation

### Performance Optimizer
- **File**: \`.cursor/tools/performance-optimizer.js\`
- **Usage**: \`node .cursor/tools/performance-optimizer.js\`
- **Description**: Performance monitoring and optimization

## Workflows

### Development Workflow
- **File**: \`.cursor/workflows.json\`
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
- **Feature branches**: \`feature/feature-name\`
- **Release branches**: \`release/version\`
- **Hotfix branches**: \`hotfix/version\`

### Commands
- \`node .cursor/automation/git-workflow.js feature <name>\`: Create feature branch
- \`node .cursor/automation/git-workflow.js release <version>\`: Create release branch
- \`node .cursor/automation/git-workflow.js commit\`: Smart commit with auto-generated message

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
- **File**: \`.cursor/settings.json\`
- **Description**: Cursor AI configuration and preferences

### MCP Servers
- **File**: \`.cursor/mcp-servers.json\`
- **Description**: MCP server configurations and settings

### Agents
- **File**: \`.cursor/agents.json\`
- **Description**: AI agent configurations and specializations

### Workflows
- **File**: \`.cursor/workflows.json\`
- **Description**: Workflow definitions and automation rules
`;

      fs.writeFileSync(path.join(docsDir, 'tools.md'), toolsDoc);

      // Create quick start guide
      const quickStartDoc = `# Quick Start Guide

## Initial Setup

1. **Run setup script**:
   \`\`\`bash
   node .cursor/setup.js
   \`\`\`

2. **Start MCP servers**:
   \`\`\`bash
   .cursor/start-mcp-servers.sh
   \`\`\`

3. **Initialize project management**:
   \`\`\`bash
   node .cursor/tools/project-management.js init
   \`\`\`

## Daily Workflow

1. **Create feature branch**:
   \`\`\`bash
   node .cursor/automation/git-workflow.js feature my-feature
   \`\`\`

2. **Make changes and commit**:
   \`\`\`bash
   node .cursor/automation/git-workflow.js commit
   \`\`\`

3. **Run tests**:
   \`\`\`bash
   node .cursor/tools/testing-suite.js
   \`\`\`

4. **Check security**:
   \`\`\`bash
   node .cursor/tools/security-pro.js
   \`\`\`

5. **Optimize performance**:
   \`\`\`bash
   node .cursor/tools/performance-optimizer.js
   \`\`\`

6. **Finish feature**:
   \`\`\`bash
   node .cursor/automation/git-workflow.js finish-feature my-feature
   \`\`\`

## Useful Commands

- **List workflows**: \`node .cursor/automation/workflow-orchestrator.js list\`
- **Execute workflow**: \`node .cursor/automation/workflow-orchestrator.js execute development\`
- **Project status**: \`node .cursor/tools/project-management.js report\`
- **Git status**: \`node .cursor/automation/git-workflow.js status\`
`;

      fs.writeFileSync(path.join(docsDir, 'quick-start.md'), quickStartDoc);

      console.log('  ✅ Documentation generated');
      this.setupLog.push('✅ Documentation generated');
    } catch (error) {
      console.warn('  ⚠️  Documentation generation failed:', error.message);
      this.setupLog.push('⚠️  Documentation generation failed');
    }
  }

  /**
   * Print setup summary
   */
  printSummary() {
    console.log('\n📋 Setup Summary:');
    console.log('================');
    
    this.setupLog.forEach(log => {
      console.log(`  ${log}`);
    });
    
    console.log('\n🎉 Setup completed! You can now use:');
    console.log('  • Cursor AI with enhanced capabilities');
    console.log('  • MCP servers for extended functionality');
    console.log('  • Automated workflows and hooks');
    console.log('  • Comprehensive testing and security tools');
    console.log('  • Performance optimization tools');
    console.log('  • Project management suite');
    
    console.log('\n📚 Documentation available at:');
    console.log('  • .cursor/docs/tools.md');
    console.log('  • .cursor/docs/quick-start.md');
    
    console.log('\n🚀 Next steps:');
    console.log('  1. Start MCP servers: .cursor/start-mcp-servers.sh');
    console.log('  2. Initialize project: node .cursor/tools/project-management.js init');
    console.log('  3. Run tests: node .cursor/tools/testing-suite.js');
    console.log('  4. Check security: node .cursor/tools/security-pro.js');
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new CursorSetup();
  setup.run().catch(console.error);
} else {
  // Also run if this is the main module
  const setup = new CursorSetup();
  setup.run().catch(console.error);
}

export default CursorSetup;
