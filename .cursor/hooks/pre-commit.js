#!/usr/bin/env node

/**
 * Pre-commit Hook for OptiAI
 * Runs before each commit to ensure code quality and security
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class PreCommitHook {
  constructor() {
    this.projectRoot = process.cwd();
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Run pre-commit checks
   */
  async run() {
    console.log('🔍 Running pre-commit checks...\n');
    
    try {
      await this.checkCodeFormatting();
      await this.runLinting();
      await this.runTests();
      await this.checkSecurity();
      await this.validatePolicy();
      await this.checkBuild();
      
      if (this.errors.length > 0) {
        console.error('\n❌ Pre-commit checks failed:');
        this.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }
      
      if (this.warnings.length > 0) {
        console.warn('\n⚠️  Pre-commit warnings:');
        this.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }
      
      console.log('\n✅ Pre-commit checks passed!');
    } catch (error) {
      console.error('\n❌ Pre-commit hook failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check code formatting
   */
  async checkCodeFormatting() {
    console.log('🎨 Checking code formatting...');
    
    try {
      // Check if Prettier is configured
      if (fs.existsSync('.prettierrc') || fs.existsSync('prettier.config.js')) {
        try {
          execSync('npx prettier --check "src/**/*.{js,jsx,ts,tsx}" "backend/**/*.py"', {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
          console.log('  ✅ Code formatting is correct');
        } catch (error) {
          this.errors.push('Code formatting issues found. Run "npx prettier --write" to fix.');
        }
      } else {
        this.warnings.push('No Prettier configuration found. Consider adding code formatting.');
      }
    } catch (error) {
      this.warnings.push('Could not check code formatting');
    }
  }

  /**
   * Run linting checks
   */
  async runLinting() {
    console.log('🔍 Running linting checks...');
    
    try {
      // ESLint for frontend
      if (fs.existsSync('package.json')) {
        try {
          execSync('npx eslint "src/**/*.{js,jsx,ts,tsx}"', {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
          console.log('  ✅ ESLint checks passed');
        } catch (error) {
          this.errors.push('ESLint errors found. Fix linting issues before committing.');
        }
      }

      // Python linting for backend
      if (fs.existsSync('backend')) {
        try {
          execSync('cd backend && python -m flake8 .', {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
          console.log('  ✅ Python linting passed');
        } catch (error) {
          this.warnings.push('Python linting issues found. Consider fixing with flake8.');
        }
      }

      // Rust linting for Tauri
      if (fs.existsSync('src-tauri')) {
        try {
          execSync('cd src-tauri && cargo clippy -- -D warnings', {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
          console.log('  ✅ Rust linting passed');
        } catch (error) {
          this.warnings.push('Rust linting issues found. Consider fixing with clippy.');
        }
      }
    } catch (error) {
      this.warnings.push('Could not run linting checks');
    }
  }

  /**
   * Run tests
   */
  async runTests() {
    console.log('🧪 Running tests...');
    
    try {
      // Frontend tests
      if (fs.existsSync('package.json')) {
        try {
          execSync('npm test -- --watchAll=false', {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
          console.log('  ✅ Frontend tests passed');
        } catch (error) {
          this.errors.push('Frontend tests failed. Fix failing tests before committing.');
        }
      }

      // Backend tests
      if (fs.existsSync('backend/tests')) {
        try {
          execSync('cd backend && python -m pytest tests/ -v', {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
          console.log('  ✅ Backend tests passed');
        } catch (error) {
          this.errors.push('Backend tests failed. Fix failing tests before committing.');
        }
      }

      // Rust tests
      if (fs.existsSync('src-tauri')) {
        try {
          execSync('cd src-tauri && cargo test', {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
          console.log('  ✅ Rust tests passed');
        } catch (error) {
          this.warnings.push('Rust tests failed. Consider fixing before committing.');
        }
      }
    } catch (error) {
      this.warnings.push('Could not run tests');
    }
  }

  /**
   * Check security
   */
  async checkSecurity() {
    console.log('🔒 Running security checks...');
    
    try {
      // NPM audit
      if (fs.existsSync('package.json')) {
        try {
          execSync('npm audit --audit-level=moderate', {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
          console.log('  ✅ NPM security audit passed');
        } catch (error) {
          this.errors.push('NPM security vulnerabilities found. Run "npm audit fix" to resolve.');
        }
      }

      // Python security check
      if (fs.existsSync('backend/requirements.txt')) {
        try {
          execSync('cd backend && pip-audit', {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
          console.log('  ✅ Python security audit passed');
        } catch (error) {
          this.warnings.push('Python security vulnerabilities found. Consider updating dependencies.');
        }
      }

      // Check for secrets
      await this.checkForSecrets();
    } catch (error) {
      this.warnings.push('Could not run security checks');
    }
  }

  /**
   * Check for hardcoded secrets
   */
  async checkForSecrets() {
    const secretPatterns = [
      { pattern: /password\s*=\s*['"][^'"]*['"]/, description: 'Hardcoded password' },
      { pattern: /api[_-]?key\s*=\s*['"][^'"]*['"]/, description: 'Hardcoded API key' },
      { pattern: /secret\s*=\s*['"][^'"]*['"]/, description: 'Hardcoded secret' },
      { pattern: /token\s*=\s*['"][^'"]*['"]/, description: 'Hardcoded token' }
    ];

    const files = this.findFiles(['src', 'backend', 'scripts'], ['.js', '.jsx', '.ts', '.tsx', '.py', '.json']);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const { pattern, description } of secretPatterns) {
        if (pattern.test(content)) {
          this.errors.push(`${description} found in ${file}. Use environment variables instead.`);
        }
      }
    }
  }

  /**
   * Validate policy compliance
   */
  async validatePolicy() {
    console.log('📋 Validating policy compliance...');
    
    try {
      const policyPath = path.join(this.projectRoot, 'policy.yaml');
      
      if (!fs.existsSync(policyPath)) {
        this.errors.push('Security policy file (policy.yaml) is missing');
        return;
      }

      const policy = fs.readFileSync(policyPath, 'utf8');
      
      // Check required sections
      const requiredSections = ['allowed_actions', 'constraints', 'protect_paths'];
      for (const section of requiredSections) {
        if (!policy.includes(section)) {
          this.errors.push(`Required policy section '${section}' is missing`);
        }
      }

      console.log('  ✅ Policy validation passed');
    } catch (error) {
      this.warnings.push('Could not validate policy compliance');
    }
  }

  /**
   * Check build
   */
  async checkBuild() {
    console.log('🔨 Checking build...');
    
    try {
      if (fs.existsSync('package.json')) {
        try {
          execSync('npm run build', {
            cwd: this.projectRoot,
            stdio: 'pipe'
          });
          console.log('  ✅ Build check passed');
        } catch (error) {
          this.errors.push('Build failed. Fix build issues before committing.');
        }
      }
    } catch (error) {
      this.warnings.push('Could not check build');
    }
  }

  /**
   * Find files with specific extensions in directories
   */
  findFiles(directories, extensions) {
    const files = [];
    
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        this.findFilesRecursive(dir, extensions, files);
      }
    }
    
    return files;
  }

  /**
   * Recursively find files with specific extensions
   */
  findFilesRecursive(dir, extensions, files) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        if (!['node_modules', '.git', 'target', 'dist', 'build'].includes(item)) {
          this.findFilesRecursive(fullPath, extensions, files);
        }
      } else if (stats.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
}

// Run the hook
if (import.meta.url === `file://${process.argv[1]}`) {
  const hook = new PreCommitHook();
  hook.run().catch(console.error);
}

export default PreCommitHook;
