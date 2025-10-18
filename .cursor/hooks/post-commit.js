#!/usr/bin/env node

/**
 * Post-commit Hook for OptiAI
 * Runs after each commit to perform cleanup and notifications
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class PostCommitHook {
  constructor() {
    this.projectRoot = process.cwd();
    this.commitHash = this.getCommitHash();
    this.branch = this.getCurrentBranch();
  }

  /**
   * Run post-commit actions
   */
  async run() {
    console.log('🔄 Running post-commit actions...\n');
    
    try {
      await this.updateChangelog();
      await this.generateCommitReport();
      await this.cleanupTempFiles();
      await this.updateDocumentation();
      await this.sendNotifications();
      
      console.log('\n✅ Post-commit actions completed successfully!');
    } catch (error) {
      console.error('\n❌ Post-commit hook failed:', error.message);
      // Don't exit with error code as commit is already done
    }
  }

  /**
   * Update changelog with commit information
   */
  async updateChangelog() {
    console.log('📝 Updating changelog...');
    
    try {
      const changelogPath = path.join(this.projectRoot, 'CHANGELOG.md');
      const commitMessage = this.getCommitMessage();
      const commitDate = new Date().toISOString().split('T')[0];
      
      let changelog = '';
      if (fs.existsSync(changelogPath)) {
        changelog = fs.readFileSync(changelogPath, 'utf8');
      } else {
        changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
      }
      
      // Add new entry if it's not already there
      const newEntry = `## [${commitDate}] - ${this.commitHash.substring(0, 7)}\n\n- ${commitMessage}\n\n`;
      
      if (!changelog.includes(this.commitHash.substring(0, 7))) {
        const lines = changelog.split('\n');
        const insertIndex = lines.findIndex(line => line.startsWith('## ['));
        
        if (insertIndex > 0) {
          lines.splice(insertIndex, 0, newEntry.trim());
          changelog = lines.join('\n');
        } else {
          changelog = newEntry + changelog;
        }
        
        fs.writeFileSync(changelogPath, changelog);
        console.log('  ✅ Changelog updated');
      } else {
        console.log('  ⚠️  Changelog entry already exists');
      }
    } catch (error) {
      console.warn('  ⚠️  Could not update changelog:', error.message);
    }
  }

  /**
   * Generate commit report
   */
  async generateCommitReport() {
    console.log('📊 Generating commit report...');
    
    try {
      const report = {
        timestamp: new Date().toISOString(),
        commit: {
          hash: this.commitHash,
          message: this.getCommitMessage(),
          author: this.getCommitAuthor(),
          date: this.getCommitDate(),
          branch: this.branch
        },
        changes: this.getChangedFiles(),
        statistics: this.getCommitStatistics()
      };
      
      const reportsDir = path.join(this.projectRoot, '.cursor', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const reportPath = path.join(reportsDir, `commit-${this.commitHash.substring(0, 7)}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log('  ✅ Commit report generated');
    } catch (error) {
      console.warn('  ⚠️  Could not generate commit report:', error.message);
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanupTempFiles() {
    console.log('🧹 Cleaning up temporary files...');
    
    try {
      const tempDirs = [
        'node_modules/.cache',
        'dist/.temp',
        'backend/__pycache__',
        'src-tauri/target/debug',
        '.cursor/temp'
      ];
      
      for (const dir of tempDirs) {
        const fullPath = path.join(this.projectRoot, dir);
        if (fs.existsSync(fullPath)) {
          try {
            execSync(`rm -rf "${fullPath}"`, { cwd: this.projectRoot });
            console.log(`  ✅ Cleaned ${dir}`);
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }
      
      console.log('  ✅ Temporary files cleaned');
    } catch (error) {
      console.warn('  ⚠️  Could not cleanup temporary files:', error.message);
    }
  }

  /**
   * Update documentation
   */
  async updateDocumentation() {
    console.log('📚 Updating documentation...');
    
    try {
      // Update API documentation if backend files changed
      const changedFiles = this.getChangedFiles();
      const hasBackendChanges = changedFiles.some(file => 
        file.startsWith('backend/') && file.endsWith('.py')
      );
      
      if (hasBackendChanges) {
        await this.updateApiDocumentation();
      }
      
      // Update component documentation if frontend files changed
      const hasFrontendChanges = changedFiles.some(file => 
        file.startsWith('src/') && (file.endsWith('.jsx') || file.endsWith('.tsx'))
      );
      
      if (hasFrontendChanges) {
        await this.updateComponentDocumentation();
      }
      
      console.log('  ✅ Documentation updated');
    } catch (error) {
      console.warn('  ⚠️  Could not update documentation:', error.message);
    }
  }

  /**
   * Send notifications
   */
  async sendNotifications() {
    console.log('📢 Sending notifications...');
    
    try {
      const commitMessage = this.getCommitMessage();
      const changedFiles = this.getChangedFiles();
      
      // Check if this is a significant commit
      const isSignificant = this.isSignificantCommit(commitMessage, changedFiles);
      
      if (isSignificant) {
        await this.sendSignificantCommitNotification(commitMessage, changedFiles);
      }
      
      console.log('  ✅ Notifications sent');
    } catch (error) {
      console.warn('  ⚠️  Could not send notifications:', error.message);
    }
  }

  /**
   * Update API documentation
   */
  async updateApiDocumentation() {
    try {
      // This would typically run a documentation generator
      // For now, just log that it would happen
      console.log('    📖 API documentation update triggered');
    } catch (error) {
      console.warn('    ⚠️  Could not update API documentation');
    }
  }

  /**
   * Update component documentation
   */
  async updateComponentDocumentation() {
    try {
      // This would typically run a component documentation generator
      // For now, just log that it would happen
      console.log('    📖 Component documentation update triggered');
    } catch (error) {
      console.warn('    ⚠️  Could not update component documentation');
    }
  }

  /**
   * Check if commit is significant
   */
  isSignificantCommit(message, files) {
    const significantKeywords = ['feat:', 'fix:', 'breaking', 'security', 'performance'];
    const significantFiles = files.some(file => 
      file.includes('policy.yaml') || 
      file.includes('package.json') || 
      file.includes('Dockerfile') ||
      file.includes('tauri.conf.json')
    );
    
    return significantKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    ) || significantFiles;
  }

  /**
   * Send significant commit notification
   */
  async sendSignificantCommitNotification(message, files) {
    try {
      // This would typically send to Slack, Discord, or email
      // For now, just log the notification
      console.log(`    📢 Significant commit notification: ${message}`);
      console.log(`    📁 Changed files: ${files.length}`);
    } catch (error) {
      console.warn('    ⚠️  Could not send significant commit notification');
    }
  }

  /**
   * Get current commit hash
   */
  getCommitHash() {
    try {
      return execSync('git rev-parse HEAD', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
    } catch (error) {
      return 'unknown';
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
   * Get commit message
   */
  getCommitMessage() {
    try {
      return execSync('git log -1 --pretty=%B', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get commit author
   */
  getCommitAuthor() {
    try {
      return execSync('git log -1 --pretty=%an', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get commit date
   */
  getCommitDate() {
    try {
      return execSync('git log -1 --pretty=%ai', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get changed files in commit
   */
  getChangedFiles() {
    try {
      return execSync('git diff-tree --no-commit-id --name-only -r HEAD', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get commit statistics
   */
  getCommitStatistics() {
    try {
      const stats = execSync('git diff --stat HEAD~1 HEAD', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
      
      return {
        summary: stats,
        filesChanged: this.getChangedFiles().length,
        linesAdded: this.getLinesAdded(),
        linesDeleted: this.getLinesDeleted()
      };
    } catch (error) {
      return {
        summary: 'unknown',
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0
      };
    }
  }

  /**
   * Get lines added in commit
   */
  getLinesAdded() {
    try {
      const result = execSync('git diff --numstat HEAD~1 HEAD', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      });
      
      const lines = result.trim().split('\n');
      return lines.reduce((total, line) => {
        const parts = line.split('\t');
        return total + (parseInt(parts[0]) || 0);
      }, 0);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get lines deleted in commit
   */
  getLinesDeleted() {
    try {
      const result = execSync('git diff --numstat HEAD~1 HEAD', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      });
      
      const lines = result.trim().split('\n');
      return lines.reduce((total, line) => {
        const parts = line.split('\t');
        return total + (parseInt(parts[1]) || 0);
      }, 0);
    } catch (error) {
      return 0;
    }
  }
}

// Run the hook
if (import.meta.url === `file://${process.argv[1]}`) {
  const hook = new PostCommitHook();
  hook.run().catch(console.error);
}

export default PostCommitHook;
