#!/usr/bin/env node

/**
 * Security Pro Tool for OptiAI
 * Comprehensive security scanning, validation, and compliance checking
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class SecurityPro {
  constructor() {
    this.projectRoot = process.cwd();
    this.securityResults = {
      vulnerabilities: [],
      policyViolations: [],
      complianceIssues: [],
      recommendations: []
    };
    this.policyPath = path.join(this.projectRoot, 'policy.yaml');
  }

  /**
   * Run comprehensive security scan
   */
  async runSecurityScan(options = {}) {
    console.log('🔒 Starting comprehensive security scan...\n');
    
    const results = {
      dependencyScan: await this.scanDependencies(),
      codeScan: await this.scanCode(),
      policyValidation: await this.validatePolicy(),
      configurationScan: await this.scanConfiguration(),
      secretsScan: await this.scanSecrets(),
      permissionsScan: await this.scanPermissions()
    };

    await this.generateSecurityReport(results);
    return results;
  }

  /**
   * Scan dependencies for vulnerabilities
   */
  async scanDependencies() {
    console.log('📦 Scanning dependencies for vulnerabilities...');
    
    const vulnerabilities = [];
    
    try {
      // NPM audit
      if (fs.existsSync('package.json')) {
        try {
          const auditResult = execSync('npm audit --json', {
            cwd: this.projectRoot,
            encoding: 'utf8'
          });
          const audit = JSON.parse(auditResult);
          
          if (audit.vulnerabilities) {
            for (const [pkg, vuln] of Object.entries(audit.vulnerabilities)) {
              vulnerabilities.push({
                type: 'npm',
                package: pkg,
                severity: vuln.severity,
                description: vuln.description,
                recommendation: vuln.recommendation
              });
            }
          }
        } catch (error) {
          console.warn('  ⚠️  NPM audit failed:', error.message);
        }
      }

      // Python dependencies
      if (fs.existsSync('backend/requirements.txt')) {
        try {
          execSync('cd backend && pip-audit --format=json', {
            cwd: this.projectRoot,
            encoding: 'utf8'
          });
        } catch (error) {
          console.warn('  ⚠️  Python audit not available');
        }
      }

      // Rust dependencies
      if (fs.existsSync('src-tauri/Cargo.toml')) {
        try {
          execSync('cd src-tauri && cargo audit', {
            cwd: this.projectRoot,
            encoding: 'utf8'
          });
        } catch (error) {
          console.warn('  ⚠️  Cargo audit not available');
        }
      }

      console.log(`  ✅ Dependency scan completed - Found ${vulnerabilities.length} vulnerabilities`);
      return { status: 'completed', vulnerabilities };
    } catch (error) {
      console.error('  ❌ Dependency scan failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Scan code for security issues
   */
  async scanCode() {
    console.log('🔍 Scanning code for security issues...');
    
    const issues = [];
    
    try {
      // Scan for common security anti-patterns
      const securityPatterns = [
        { pattern: /eval\s*\(/, severity: 'high', description: 'Use of eval() function' },
        { pattern: /innerHTML\s*=/, severity: 'medium', description: 'Direct innerHTML assignment' },
        { pattern: /document\.write\s*\(/, severity: 'medium', description: 'Use of document.write()' },
        { pattern: /localStorage\.setItem\s*\([^,]+,\s*[^)]*\)/, severity: 'low', description: 'Sensitive data in localStorage' },
        { pattern: /sessionStorage\.setItem\s*\([^,]+,\s*[^)]*\)/, severity: 'low', description: 'Sensitive data in sessionStorage' },
        { pattern: /password\s*=\s*['"][^'"]*['"]/, severity: 'high', description: 'Hardcoded password' },
        { pattern: /api[_-]?key\s*=\s*['"][^'"]*['"]/, severity: 'high', description: 'Hardcoded API key' },
        { pattern: /secret\s*=\s*['"][^'"]*['"]/, severity: 'high', description: 'Hardcoded secret' },
        { pattern: /token\s*=\s*['"][^'"]*['"]/, severity: 'high', description: 'Hardcoded token' }
      ];

      // Scan JavaScript/TypeScript files
      const jsFiles = this.findFiles(['src', 'backend'], ['.js', '.jsx', '.ts', '.tsx']);
      for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf8');
        for (const { pattern, severity, description } of securityPatterns) {
          const matches = content.match(new RegExp(pattern, 'g'));
          if (matches) {
            issues.push({
              file,
              severity,
              description,
              matches: matches.length,
              type: 'code-pattern'
            });
          }
        }
      }

      // Scan Python files
      const pythonFiles = this.findFiles(['backend'], ['.py']);
      for (const file of pythonFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for dangerous Python patterns
        const pythonPatterns = [
          { pattern: /exec\s*\(/, severity: 'high', description: 'Use of exec() function' },
          { pattern: /eval\s*\(/, severity: 'high', description: 'Use of eval() function' },
          { pattern: /subprocess\.call\s*\([^)]*shell\s*=\s*True/, severity: 'high', description: 'Shell injection risk' },
          { pattern: /os\.system\s*\(/, severity: 'high', description: 'Use of os.system()' },
          { pattern: /pickle\.loads\s*\(/, severity: 'medium', description: 'Unsafe pickle deserialization' }
        ];

        for (const { pattern, severity, description } of pythonPatterns) {
          const matches = content.match(new RegExp(pattern, 'g'));
          if (matches) {
            issues.push({
              file,
              severity,
              description,
              matches: matches.length,
              type: 'code-pattern'
            });
          }
        }
      }

      console.log(`  ✅ Code scan completed - Found ${issues.length} security issues`);
      return { status: 'completed', issues };
    } catch (error) {
      console.error('  ❌ Code scan failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Validate security policy compliance
   */
  async validatePolicy() {
    console.log('📋 Validating security policy compliance...');
    
    const violations = [];
    
    try {
      if (!fs.existsSync(this.policyPath)) {
        violations.push({
          type: 'missing-policy',
          severity: 'high',
          description: 'Security policy file (policy.yaml) not found',
          recommendation: 'Create policy.yaml with security constraints'
        });
        return { status: 'failed', violations };
      }

      const policy = fs.readFileSync(this.policyPath, 'utf8');
      
      // Validate required policy sections
      const requiredSections = [
        'allowed_actions',
        'constraints',
        'protect_paths'
      ];

      for (const section of requiredSections) {
        if (!policy.includes(section)) {
          violations.push({
            type: 'missing-section',
            severity: 'high',
            description: `Required policy section '${section}' is missing`,
            recommendation: `Add '${section}' section to policy.yaml`
          });
        }
      }

      // Validate policy constraints
      if (policy.includes('constraints')) {
        const constraints = this.extractYamlSection(policy, 'constraints');
        
        // Check for required constraints
        const requiredConstraints = [
          'max_batch',
          'max_single_delete_bytes',
          'require_confirm',
          'quarantine_ttl_days'
        ];

        for (const constraint of requiredConstraints) {
          if (!constraints.includes(constraint)) {
            violations.push({
              type: 'missing-constraint',
              severity: 'medium',
              description: `Required constraint '${constraint}' is missing`,
              recommendation: `Add '${constraint}' to constraints section`
            });
          }
        }
      }

      // Validate protected paths
      if (policy.includes('protect_paths')) {
        const protectPaths = this.extractYamlSection(policy, 'protect_paths');
        const requiredPaths = ['/Windows', '/Program Files', '/usr', '/etc'];
        
        for (const path of requiredPaths) {
          if (!protectPaths.includes(path)) {
            violations.push({
              type: 'missing-protected-path',
              severity: 'medium',
              description: `Required protected path '${path}' is missing`,
              recommendation: `Add '${path}' to protect_paths`
            });
          }
        }
      }

      console.log(`  ✅ Policy validation completed - Found ${violations.length} violations`);
      return { status: 'completed', violations };
    } catch (error) {
      console.error('  ❌ Policy validation failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Scan configuration files for security issues
   */
  async scanConfiguration() {
    console.log('⚙️  Scanning configuration files...');
    
    const issues = [];
    
    try {
      const configFiles = [
        'package.json',
        'vite.config.js',
        'tailwind.config.js',
        'postcss.config.js',
        'src-tauri/tauri.conf.json',
        'backend/main.py',
        'Dockerfile',
        'docker-compose.yml'
      ];

      for (const configFile of configFiles) {
        if (fs.existsSync(configFile)) {
          const content = fs.readFileSync(configFile, 'utf8');
          
          // Check for sensitive information
          const sensitivePatterns = [
            { pattern: /password\s*[:=]\s*['"][^'"]*['"]/, severity: 'high', description: 'Hardcoded password in config' },
            { pattern: /secret\s*[:=]\s*['"][^'"]*['"]/, severity: 'high', description: 'Hardcoded secret in config' },
            { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/, severity: 'high', description: 'Hardcoded API key in config' },
            { pattern: /token\s*[:=]\s*['"][^'"]*['"]/, severity: 'high', description: 'Hardcoded token in config' },
            { pattern: /debug\s*[:=]\s*true/, severity: 'medium', description: 'Debug mode enabled in production config' }
          ];

          for (const { pattern, severity, description } of sensitivePatterns) {
            const matches = content.match(new RegExp(pattern, 'g'));
            if (matches) {
              issues.push({
                file: configFile,
                severity,
                description,
                matches: matches.length,
                type: 'config-issue'
              });
            }
          }
        }
      }

      console.log(`  ✅ Configuration scan completed - Found ${issues.length} issues`);
      return { status: 'completed', issues };
    } catch (error) {
      console.error('  ❌ Configuration scan failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Scan for secrets and sensitive data
   */
  async scanSecrets() {
    console.log('🔐 Scanning for secrets and sensitive data...');
    
    const secrets = [];
    
    try {
      // Common secret patterns
      const secretPatterns = [
        { pattern: /[A-Za-z0-9+/]{40,}={0,2}/, description: 'Potential base64 encoded secret' },
        { pattern: /[A-Za-z0-9]{32,}/, description: 'Potential hash or token' },
        { pattern: /sk-[A-Za-z0-9]{48}/, description: 'OpenAI API key' },
        { pattern: /pk_[A-Za-z0-9]{24}/, description: 'Stripe public key' },
        { pattern: /sk_[A-Za-z0-9]{24}/, description: 'Stripe secret key' },
        { pattern: /[A-Za-z0-9]{20,}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, description: 'Email address' },
        { pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]*['"]/, description: 'Password field' }
      ];

      const files = this.findFiles(['src', 'backend', 'scripts'], ['.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.yaml', '.yml']);
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const { pattern, description } of secretPatterns) {
          const matches = content.match(new RegExp(pattern, 'g'));
          if (matches) {
            secrets.push({
              file,
              description,
              matches: matches.length,
              type: 'potential-secret'
            });
          }
        }
      }

      console.log(`  ✅ Secrets scan completed - Found ${secrets.length} potential secrets`);
      return { status: 'completed', secrets };
    } catch (error) {
      console.error('  ❌ Secrets scan failed:', error.message);
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * Scan file permissions and access controls
   */
  async scanPermissions() {
    console.log('🔑 Scanning file permissions and access controls...');
    
    const issues = [];
    
    try {
      // Check for overly permissive files
      const sensitiveFiles = [
        'policy.yaml',
        'package.json',
        'src-tauri/tauri.conf.json',
        'backend/main.py',
        '.env',
        '.env.local',
        '.env.production'
      ];

      for (const file of sensitiveFiles) {
        if (fs.existsSync(file)) {
          try {
            const stats = fs.statSync(file);
            const mode = stats.mode.toString(8);
            
            // Check if file is world-readable (permission 644 or more permissive)
            if (mode.endsWith('4') || mode.endsWith('5') || mode.endsWith('6') || mode.endsWith('7')) {
              issues.push({
                file,
                severity: 'medium',
                description: 'File is world-readable',
                recommendation: 'Restrict file permissions to owner and group only'
              });
            }
          } catch (error) {
            // Skip files that can't be stat'd
          }
        }
      }

      console.log(`  ✅ Permissions scan completed - Found ${issues.length} permission issues`);
      return { status: 'completed', issues };
    } catch (error) {
      console.error('  ❌ Permissions scan failed:', error.message);
      return { status: 'failed', error: error.message };
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
        // Skip node_modules and other common directories
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

  /**
   * Extract YAML section content
   */
  extractYamlSection(yaml, section) {
    const lines = yaml.split('\n');
    const sectionLines = [];
    let inSection = false;
    let indentLevel = 0;
    
    for (const line of lines) {
      if (line.trim().startsWith(section + ':')) {
        inSection = true;
        indentLevel = line.search(/\S/);
        continue;
      }
      
      if (inSection) {
        const currentIndent = line.search(/\S/);
        if (currentIndent !== -1 && currentIndent <= indentLevel && line.trim()) {
          break;
        }
        sectionLines.push(line);
      }
    }
    
    return sectionLines.join('\n');
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport(results) {
    console.log('📊 Generating security report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalVulnerabilities: 0,
        totalIssues: 0,
        totalViolations: 0,
        totalSecrets: 0,
        totalPermissionIssues: 0,
        riskLevel: 'low'
      },
      results,
      recommendations: []
    };

    // Calculate summary
    if (results.dependencyScan?.vulnerabilities) {
      report.summary.totalVulnerabilities = results.dependencyScan.vulnerabilities.length;
    }
    if (results.codeScan?.issues) {
      report.summary.totalIssues = results.codeScan.issues.length;
    }
    if (results.policyValidation?.violations) {
      report.summary.totalViolations = results.policyValidation.vulnerabilities.length;
    }
    if (results.secretsScan?.secrets) {
      report.summary.totalSecrets = results.secretsScan.secrets.length;
    }
    if (results.permissionsScan?.issues) {
      report.summary.totalPermissionIssues = results.permissionsScan.issues.length;
    }

    // Calculate risk level
    const highSeverityCount = [
      ...(results.dependencyScan?.vulnerabilities || []).filter(v => v.severity === 'high'),
      ...(results.codeScan?.issues || []).filter(i => i.severity === 'high'),
      ...(results.policyValidation?.violations || []).filter(v => v.severity === 'high'),
      ...(results.configurationScan?.issues || []).filter(i => i.severity === 'high'),
      ...(results.permissionsScan?.issues || []).filter(i => i.severity === 'high')
    ].length;

    if (highSeverityCount > 5) {
      report.summary.riskLevel = 'critical';
    } else if (highSeverityCount > 2) {
      report.summary.riskLevel = 'high';
    } else if (highSeverityCount > 0) {
      report.summary.riskLevel = 'medium';
    }

    // Generate recommendations
    if (report.summary.totalVulnerabilities > 0) {
      report.recommendations.push('Update vulnerable dependencies to latest secure versions');
    }
    if (report.summary.totalIssues > 0) {
      report.recommendations.push('Review and fix code security issues');
    }
    if (report.summary.totalViolations > 0) {
      report.recommendations.push('Update security policy to address violations');
    }
    if (report.summary.totalSecrets > 0) {
      report.recommendations.push('Remove hardcoded secrets and use environment variables');
    }
    if (report.summary.totalPermissionIssues > 0) {
      report.recommendations.push('Restrict file permissions for sensitive files');
    }

    const reportPath = path.join(this.projectRoot, 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Security report generated: ${reportPath}`);
    console.log(`\n🔒 Security Summary:`);
    console.log(`  Risk Level: ${report.summary.riskLevel.toUpperCase()}`);
    console.log(`  Vulnerabilities: ${report.summary.totalVulnerabilities}`);
    console.log(`  Code Issues: ${report.summary.totalIssues}`);
    console.log(`  Policy Violations: ${report.summary.totalViolations}`);
    console.log(`  Potential Secrets: ${report.summary.totalSecrets}`);
    console.log(`  Permission Issues: ${report.summary.totalPermissionIssues}`);
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dependencies-only':
        options.dependenciesOnly = true;
        break;
      case '--code-only':
        options.codeOnly = true;
        break;
      case '--policy-only':
        options.policyOnly = true;
        break;
      case '--secrets-only':
        options.secretsOnly = true;
        break;
    }
  }

  const securityPro = new SecurityPro();
  securityPro.runSecurityScan(options).catch(console.error);
}

export default SecurityPro;
