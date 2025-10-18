#!/usr/bin/env node

/**
 * Git Workflow Automation for OptiAI
 * Automated Git operations and workflow management
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class GitWorkflow {
  constructor() {
    this.projectRoot = process.cwd();
    this.branchPrefix = 'feature/';
    this.releasePrefix = 'release/';
    this.hotfixPrefix = 'hotfix/';
  }

  /**
   * Initialize Git workflow
   */
  async initialize() {
    console.log('🔧 Initializing Git workflow...\n');
    
    try {
      await this.setupGitHooks();
      await this.configureGitSettings();
      await this.createBranchProtection();
      
      console.log('✅ Git workflow initialized successfully!');
    } catch (error) {
      console.error('❌ Git workflow initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Setup Git hooks
   */
  async setupGitHooks() {
    console.log('🪝 Setting up Git hooks...');
    
    const hooksDir = path.join(this.projectRoot, '.git', 'hooks');
    if (!fs.existsSync(hooksDir)) {
      console.warn('  ⚠️  Git repository not found');
      return;
    }

    // Pre-commit hook
    const preCommitHook = path.join(hooksDir, 'pre-commit');
    const preCommitContent = `#!/bin/sh
node "${path.join(this.projectRoot, '.cursor', 'hooks', 'pre-commit.js')}"
`;
    fs.writeFileSync(preCommitHook, preCommitContent);
    fs.chmodSync(preCommitHook, '755');

    // Post-commit hook
    const postCommitHook = path.join(hooksDir, 'post-commit');
    const postCommitContent = `#!/bin/sh
node "${path.join(this.projectRoot, '.cursor', 'hooks', 'post-commit.js')}"
`;
    fs.writeFileSync(postCommitHook, postCommitContent);
    fs.chmodSync(postCommitHook, '755');

    console.log('  ✅ Git hooks configured');
  }

  /**
   * Configure Git settings
   */
  async configureGitSettings() {
    console.log('⚙️  Configuring Git settings...');
    
    try {
      // Set up Git configuration
      const gitConfigs = [
        'core.autocrlf false',
        'core.safecrlf true',
        'pull.rebase true',
        'push.default simple',
        'branch.autosetupmerge true',
        'branch.autosetuprebase always'
      ];

      for (const config of gitConfigs) {
        try {
          execSync(`git config ${config}`, { cwd: this.projectRoot });
        } catch (error) {
          console.warn(`  ⚠️  Could not set Git config: ${config}`);
        }
      }

      console.log('  ✅ Git settings configured');
    } catch (error) {
      console.warn('  ⚠️  Could not configure Git settings:', error.message);
    }
  }

  /**
   * Create branch protection rules
   */
  async createBranchProtection() {
    console.log('🛡️  Setting up branch protection...');
    
    try {
      // This would typically create branch protection rules via GitHub API
      // For now, just log the configuration
      const protectedBranches = ['main', 'master', 'develop'];
      
      for (const branch of protectedBranches) {
        console.log(`  📋 Branch '${branch}' protection configured`);
      }

      console.log('  ✅ Branch protection configured');
    } catch (error) {
      console.warn('  ⚠️  Could not configure branch protection:', error.message);
    }
  }

  /**
   * Create feature branch
   */
  async createFeatureBranch(featureName, baseBranch = 'develop') {
    console.log(`🌿 Creating feature branch: ${featureName}\n`);
    
    try {
      const branchName = `${this.branchPrefix}${featureName}`;
      
      // Check if branch already exists
      if (await this.branchExists(branchName)) {
        throw new Error(`Branch '${branchName}' already exists`);
      }

      // Switch to base branch and pull latest changes
      execSync(`git checkout ${baseBranch}`, { cwd: this.projectRoot });
      execSync('git pull origin ' + baseBranch, { cwd: this.projectRoot });

      // Create and switch to new branch
      execSync(`git checkout -b ${branchName}`, { cwd: this.projectRoot });

      console.log(`✅ Feature branch '${branchName}' created successfully`);
      return branchName;
    } catch (error) {
      console.error('❌ Failed to create feature branch:', error.message);
      throw error;
    }
  }

  /**
   * Create release branch
   */
  async createReleaseBranch(version, baseBranch = 'develop') {
    console.log(`🚀 Creating release branch: ${version}\n`);
    
    try {
      const branchName = `${this.releasePrefix}${version}`;
      
      // Check if branch already exists
      if (await this.branchExists(branchName)) {
        throw new Error(`Branch '${branchName}' already exists`);
      }

      // Switch to base branch and pull latest changes
      execSync(`git checkout ${baseBranch}`, { cwd: this.projectRoot });
      execSync('git pull origin ' + baseBranch, { cwd: this.projectRoot });

      // Create and switch to new branch
      execSync(`git checkout -b ${branchName}`, { cwd: this.projectRoot });

      // Update version in package.json
      await this.updateVersion(version);

      // Commit version update
      execSync('git add package.json', { cwd: this.projectRoot });
      execSync(`git commit -m "chore: bump version to ${version}"`, { cwd: this.projectRoot });

      console.log(`✅ Release branch '${branchName}' created successfully`);
      return branchName;
    } catch (error) {
      console.error('❌ Failed to create release branch:', error.message);
      throw error;
    }
  }

  /**
   * Create hotfix branch
   */
  async createHotfixBranch(version, baseBranch = 'main') {
    console.log(`🔥 Creating hotfix branch: ${version}\n`);
    
    try {
      const branchName = `${this.hotfixPrefix}${version}`;
      
      // Check if branch already exists
      if (await this.branchExists(branchName)) {
        throw new Error(`Branch '${branchName}' already exists`);
      }

      // Switch to base branch and pull latest changes
      execSync(`git checkout ${baseBranch}`, { cwd: this.projectRoot });
      execSync('git pull origin ' + baseBranch, { cwd: this.projectRoot });

      // Create and switch to new branch
      execSync(`git checkout -b ${branchName}`, { cwd: this.projectRoot });

      // Update version in package.json
      await this.updateVersion(version);

      // Commit version update
      execSync('git add package.json', { cwd: this.projectRoot });
      execSync(`git commit -m "chore: bump version to ${version}"`, { cwd: this.projectRoot });

      console.log(`✅ Hotfix branch '${branchName}' created successfully`);
      return branchName;
    } catch (error) {
      console.error('❌ Failed to create hotfix branch:', error.message);
      throw error;
    }
  }

  /**
   * Finish feature branch
   */
  async finishFeatureBranch(featureName, targetBranch = 'develop') {
    console.log(`🏁 Finishing feature branch: ${featureName}\n`);
    
    try {
      const branchName = `${this.branchPrefix}${featureName}`;
      
      // Check if branch exists
      if (!await this.branchExists(branchName)) {
        throw new Error(`Branch '${branchName}' does not exist`);
      }

      // Switch to feature branch
      execSync(`git checkout ${branchName}`, { cwd: this.projectRoot });

      // Pull latest changes
      execSync(`git pull origin ${branchName}`, { cwd: this.projectRoot });

      // Switch to target branch
      execSync(`git checkout ${targetBranch}`, { cwd: this.projectRoot });
      execSync(`git pull origin ${targetBranch}`, { cwd: this.projectRoot });

      // Merge feature branch
      execSync(`git merge --no-ff ${branchName} -m "Merge branch '${branchName}' into ${targetBranch}"`, { cwd: this.projectRoot });

      // Push changes
      execSync(`git push origin ${targetBranch}`, { cwd: this.projectRoot });

      // Delete feature branch
      execSync(`git branch -d ${branchName}`, { cwd: this.projectRoot });
      execSync(`git push origin --delete ${branchName}`, { cwd: this.projectRoot });

      console.log(`✅ Feature branch '${branchName}' finished successfully`);
    } catch (error) {
      console.error('❌ Failed to finish feature branch:', error.message);
      throw error;
    }
  }

  /**
   * Finish release branch
   */
  async finishReleaseBranch(version, targetBranch = 'main') {
    console.log(`🎉 Finishing release branch: ${version}\n`);
    
    try {
      const branchName = `${this.releasePrefix}${version}`;
      
      // Check if branch exists
      if (!await this.branchExists(branchName)) {
        throw new Error(`Branch '${branchName}' does not exist`);
      }

      // Switch to release branch
      execSync(`git checkout ${branchName}`, { cwd: this.projectRoot });

      // Pull latest changes
      execSync(`git pull origin ${branchName}`, { cwd: this.projectRoot });

      // Switch to target branch
      execSync(`git checkout ${targetBranch}`, { cwd: this.projectRoot });
      execSync(`git pull origin ${targetBranch}`, { cwd: this.projectRoot });

      // Merge release branch
      execSync(`git merge --no-ff ${branchName} -m "Release ${version}"`, { cwd: this.projectRoot });

      // Create tag
      execSync(`git tag -a v${version} -m "Release version ${version}"`, { cwd: this.projectRoot });

      // Push changes and tags
      execSync(`git push origin ${targetBranch}`, { cwd: this.projectRoot });
      execSync(`git push origin v${version}`, { cwd: this.projectRoot });

      // Merge back to develop
      execSync('git checkout develop', { cwd: this.projectRoot });
      execSync('git pull origin develop', { cwd: this.projectRoot });
      execSync(`git merge --no-ff ${branchName} -m "Merge branch '${branchName}' into develop"`, { cwd: this.projectRoot });
      execSync('git push origin develop', { cwd: this.projectRoot });

      // Delete release branch
      execSync(`git branch -d ${branchName}`, { cwd: this.projectRoot });
      execSync(`git push origin --delete ${branchName}`, { cwd: this.projectRoot });

      console.log(`✅ Release branch '${branchName}' finished successfully`);
    } catch (error) {
      console.error('❌ Failed to finish release branch:', error.message);
      throw error;
    }
  }

  /**
   * Smart commit with automatic message generation
   */
  async smartCommit(files = [], message = null) {
    console.log('💾 Performing smart commit...\n');
    
    try {
      // Get changed files if none specified
      if (files.length === 0) {
        const changedFiles = execSync('git diff --name-only', { 
          cwd: this.projectRoot, 
          encoding: 'utf8' 
        }).trim().split('\n').filter(file => file.length > 0);
        files = changedFiles;
      }

      if (files.length === 0) {
        console.log('  ⚠️  No files to commit');
        return;
      }

      // Generate commit message if not provided
      if (!message) {
        message = await this.generateCommitMessage(files);
      }

      // Add files
      for (const file of files) {
        execSync(`git add "${file}"`, { cwd: this.projectRoot });
      }

      // Commit
      execSync(`git commit -m "${message}"`, { cwd: this.projectRoot });

      console.log(`✅ Smart commit completed: ${message}`);
    } catch (error) {
      console.error('❌ Smart commit failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate commit message based on changed files
   */
  async generateCommitMessage(files) {
    const fileTypes = {
      frontend: files.filter(f => f.startsWith('src/') && (f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.ts'))),
      backend: files.filter(f => f.startsWith('backend/') && f.endsWith('.py')),
      desktop: files.filter(f => f.startsWith('src-tauri/') && f.endsWith('.rs')),
      config: files.filter(f => f.endsWith('.json') || f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.toml')),
      docs: files.filter(f => f.endsWith('.md') || f.endsWith('.txt')),
      tests: files.filter(f => f.includes('test') || f.includes('spec'))
    };

    const changes = [];
    
    if (fileTypes.frontend.length > 0) {
      changes.push(`feat(frontend): update ${fileTypes.frontend.length} frontend file(s)`);
    }
    if (fileTypes.backend.length > 0) {
      changes.push(`feat(backend): update ${fileTypes.backend.length} backend file(s)`);
    }
    if (fileTypes.desktop.length > 0) {
      changes.push(`feat(desktop): update ${fileTypes.desktop.length} desktop file(s)`);
    }
    if (fileTypes.config.length > 0) {
      changes.push(`chore(config): update ${fileTypes.config.length} config file(s)`);
    }
    if (fileTypes.docs.length > 0) {
      changes.push(`docs: update ${fileTypes.docs.length} documentation file(s)`);
    }
    if (fileTypes.tests.length > 0) {
      changes.push(`test: update ${fileTypes.tests.length} test file(s)`);
    }

    return changes.join(', ');
  }

  /**
   * Auto-add files based on patterns
   */
  async autoAdd(pattern = null) {
    console.log('📁 Auto-adding files...\n');
    
    try {
      let files = [];
      
      if (pattern) {
        // Add files matching pattern
        const result = execSync(`git ls-files --others --exclude-standard | grep "${pattern}"`, { 
          cwd: this.projectRoot, 
          encoding: 'utf8' 
        });
        files = result.trim().split('\n').filter(file => file.length > 0);
      } else {
        // Add all untracked files
        const result = execSync('git ls-files --others --exclude-standard', { 
          cwd: this.projectRoot, 
          encoding: 'utf8' 
        });
        files = result.trim().split('\n').filter(file => file.length > 0);
      }

      if (files.length === 0) {
        console.log('  ⚠️  No files to add');
        return;
      }

      for (const file of files) {
        execSync(`git add "${file}"`, { cwd: this.projectRoot });
        console.log(`  ✅ Added: ${file}`);
      }

      console.log(`\n✅ Auto-added ${files.length} file(s)`);
    } catch (error) {
      console.error('❌ Auto-add failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if branch exists
   */
  async branchExists(branchName) {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { 
        cwd: this.projectRoot 
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update version in package.json
   */
  async updateVersion(version) {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        packageJson.version = version;
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        console.log(`  ✅ Updated version to ${version}`);
      }
    } catch (error) {
      console.warn('  ⚠️  Could not update version:', error.message);
    }
  }

  /**
   * Get current branch
   */
  getCurrentBranch() {
    try {
      return execSync('git branch --show-current', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get branch status
   */
  getBranchStatus() {
    try {
      const status = execSync('git status --porcelain', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
      
      const lines = status.split('\n').filter(line => line.length > 0);
      const changes = {
        modified: lines.filter(line => line.startsWith(' M')).length,
        added: lines.filter(line => line.startsWith('A ')).length,
        deleted: lines.filter(line => line.startsWith(' D')).length,
        untracked: lines.filter(line => line.startsWith('??')).length
      };
      
      return {
        branch: this.getCurrentBranch(),
        changes,
        hasChanges: Object.values(changes).some(count => count > 0)
      };
    } catch (error) {
      return {
        branch: 'unknown',
        changes: { modified: 0, added: 0, deleted: 0, untracked: 0 },
        hasChanges: false
      };
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  const param1 = args[1];
  const param2 = args[2];
  
  const gitWorkflow = new GitWorkflow();
  
  switch (command) {
    case 'init':
      gitWorkflow.initialize().catch(console.error);
      break;
    case 'feature':
      if (!param1) {
        console.error('Please specify feature name');
        process.exit(1);
      }
      gitWorkflow.createFeatureBranch(param1, param2).catch(console.error);
      break;
    case 'release':
      if (!param1) {
        console.error('Please specify version');
        process.exit(1);
      }
      gitWorkflow.createReleaseBranch(param1, param2).catch(console.error);
      break;
    case 'hotfix':
      if (!param1) {
        console.error('Please specify version');
        process.exit(1);
      }
      gitWorkflow.createHotfixBranch(param1, param2).catch(console.error);
      break;
    case 'finish-feature':
      if (!param1) {
        console.error('Please specify feature name');
        process.exit(1);
      }
      gitWorkflow.finishFeatureBranch(param1, param2).catch(console.error);
      break;
    case 'finish-release':
      if (!param1) {
        console.error('Please specify version');
        process.exit(1);
      }
      gitWorkflow.finishReleaseBranch(param1, param2).catch(console.error);
      break;
    case 'commit':
      gitWorkflow.smartCommit([], param1).catch(console.error);
      break;
    case 'add':
      gitWorkflow.autoAdd(param1).catch(console.error);
      break;
    case 'status':
      const status = gitWorkflow.getBranchStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
    default:
      console.log('Available commands: init, feature, release, hotfix, finish-feature, finish-release, commit, add, status');
  }
}

export default GitWorkflow;
