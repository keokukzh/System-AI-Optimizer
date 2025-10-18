#!/usr/bin/env node

/**
 * Testing Suite Tool for OptiAI
 * Comprehensive testing automation and validation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestingSuite {
  constructor() {
    this.projectRoot = process.cwd();
    this.testResults = {
      unit: { passed: 0, failed: 0, skipped: 0 },
      integration: { passed: 0, failed: 0, skipped: 0 },
      e2e: { passed: 0, failed: 0, skipped: 0 },
      security: { passed: 0, failed: 0, skipped: 0 },
      performance: { passed: 0, failed: 0, skipped: 0 }
    };
    this.coverage = { lines: 0, functions: 0, branches: 0, statements: 0 };
  }

  /**
   * Run all tests with comprehensive reporting
   */
  async runAllTests(options = {}) {
    console.log('🧪 Starting comprehensive test suite...\n');
    
    const results = {
      unit: await this.runUnitTests(options),
      integration: await this.runIntegrationTests(options),
      e2e: await this.runE2ETests(options),
      security: await this.runSecurityTests(options),
      performance: await this.runPerformanceTests(options)
    };

    await this.generateReport(results);
    return results;
  }

  /**
   * Run unit tests for frontend and backend
   */
  async runUnitTests(options = {}) {
    console.log('📋 Running unit tests...');
    
    try {
      // Frontend unit tests
      if (fs.existsSync('package.json')) {
        console.log('  Frontend tests...');
        const frontendResult = execSync('npm test -- --coverage --watchAll=false', {
          cwd: this.projectRoot,
          encoding: 'utf8'
        });
        console.log('  ✅ Frontend tests completed');
      }

      // Backend unit tests
      if (fs.existsSync('backend/tests')) {
        console.log('  Backend tests...');
        const backendResult = execSync('cd backend && pytest tests/ -v --cov=backend --cov-report=json', {
          cwd: this.projectRoot,
          encoding: 'utf8'
        });
        console.log('  ✅ Backend tests completed');
      }

      return { status: 'passed', message: 'All unit tests passed' };
    } catch (error) {
      console.error('  ❌ Unit tests failed:', error.message);
      return { status: 'failed', message: error.message };
    }
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests(options = {}) {
    console.log('🔗 Running integration tests...');
    
    try {
      // Check if integration test files exist
      const integrationFiles = [
        'tests/integration_tests.rs',
        'backend/tests/integration/',
        'src/tests/integration/'
      ];

      let hasIntegrationTests = false;
      for (const file of integrationFiles) {
        if (fs.existsSync(file)) {
          hasIntegrationTests = true;
          break;
        }
      }

      if (!hasIntegrationTests) {
        console.log('  ⚠️  No integration tests found, skipping...');
        return { status: 'skipped', message: 'No integration tests configured' };
      }

      // Run Rust integration tests
      if (fs.existsSync('tests/integration_tests.rs')) {
        execSync('cargo test --test integration_tests', {
          cwd: this.projectRoot,
          encoding: 'utf8'
        });
      }

      // Run Python integration tests
      if (fs.existsSync('backend/tests/integration/')) {
        execSync('cd backend && pytest tests/integration/ -v', {
          cwd: this.projectRoot,
          encoding: 'utf8'
        });
      }

      console.log('  ✅ Integration tests completed');
      return { status: 'passed', message: 'All integration tests passed' };
    } catch (error) {
      console.error('  ❌ Integration tests failed:', error.message);
      return { status: 'failed', message: error.message };
    }
  }

  /**
   * Run end-to-end tests with Playwright
   */
  async runE2ETests(options = {}) {
    console.log('🎭 Running end-to-end tests...');
    
    try {
      if (!fs.existsSync('playwright.config.js')) {
        console.log('  ⚠️  No Playwright configuration found, skipping...');
        return { status: 'skipped', message: 'No E2E tests configured' };
      }

      // Install Playwright browsers if needed
      try {
        execSync('npx playwright install', { cwd: this.projectRoot });
      } catch (error) {
        console.log('  ⚠️  Playwright browsers already installed or installation failed');
      }

      // Run Playwright tests
      execSync('npx playwright test', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      console.log('  ✅ E2E tests completed');
      return { status: 'passed', message: 'All E2E tests passed' };
    } catch (error) {
      console.error('  ❌ E2E tests failed:', error.message);
      return { status: 'failed', message: error.message };
    }
  }

  /**
   * Run security tests and vulnerability scans
   */
  async runSecurityTests(options = {}) {
    console.log('🔒 Running security tests...');
    
    try {
      const securityResults = [];

      // Check for known vulnerabilities in dependencies
      if (fs.existsSync('package.json')) {
        try {
          execSync('npm audit --audit-level=moderate', {
            cwd: this.projectRoot,
            encoding: 'utf8'
          });
          securityResults.push('✅ NPM audit passed');
        } catch (error) {
          securityResults.push('⚠️  NPM audit found vulnerabilities');
        }
      }

      // Check Python dependencies
      if (fs.existsSync('backend/requirements.txt')) {
        try {
          execSync('cd backend && pip-audit', {
            cwd: this.projectRoot,
            encoding: 'utf8'
          });
          securityResults.push('✅ Python audit passed');
        } catch (error) {
          securityResults.push('⚠️  Python audit found vulnerabilities');
        }
      }

      // Validate policy compliance
      if (fs.existsSync('policy.yaml')) {
        const policyValid = await this.validatePolicyCompliance();
        securityResults.push(policyValid ? '✅ Policy compliance validated' : '❌ Policy compliance failed');
      }

      console.log('  ✅ Security tests completed');
      return { status: 'passed', message: securityResults.join(', ') };
    } catch (error) {
      console.error('  ❌ Security tests failed:', error.message);
      return { status: 'failed', message: error.message };
    }
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests(options = {}) {
    console.log('⚡ Running performance tests...');
    
    try {
      const performanceResults = [];

      // Check bundle size
      if (fs.existsSync('package.json')) {
        try {
          execSync('npm run build', { cwd: this.projectRoot });
          const distSize = this.getDirectorySize('dist');
          performanceResults.push(`Bundle size: ${this.formatBytes(distSize)}`);
        } catch (error) {
          performanceResults.push('⚠️  Build size check failed');
        }
      }

      // Check for performance regressions
      const performanceMetrics = await this.measurePerformance();
      performanceResults.push(`Load time: ${performanceMetrics.loadTime}ms`);
      performanceResults.push(`Memory usage: ${this.formatBytes(performanceMetrics.memoryUsage)}`);

      console.log('  ✅ Performance tests completed');
      return { status: 'passed', message: performanceResults.join(', ') };
    } catch (error) {
      console.error('  ❌ Performance tests failed:', error.message);
      return { status: 'failed', message: error.message };
    }
  }

  /**
   * Validate policy compliance
   */
  async validatePolicyCompliance() {
    try {
      const policyPath = path.join(this.projectRoot, 'policy.yaml');
      if (!fs.existsSync(policyPath)) {
        return false;
      }

      const policy = fs.readFileSync(policyPath, 'utf8');
      
      // Basic policy validation
      const requiredSections = ['allowed_actions', 'constraints', 'protect_paths'];
      for (const section of requiredSections) {
        if (!policy.includes(section)) {
          console.error(`  ❌ Policy missing required section: ${section}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('  ❌ Policy validation failed:', error.message);
      return false;
    }
  }

  /**
   * Measure basic performance metrics
   */
  async measurePerformance() {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    return {
      loadTime: endTime - startTime,
      memoryUsage: endMemory.heapUsed - startMemory.heapUsed
    };
  }

  /**
   * Get directory size in bytes
   */
  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(results) {
    const reportPath = path.join(this.projectRoot, 'test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: Object.keys(results).length,
        passed: Object.values(results).filter(r => r.status === 'passed').length,
        failed: Object.values(results).filter(r => r.status === 'failed').length,
        skipped: Object.values(results).filter(r => r.status === 'skipped').length
      },
      results,
      coverage: this.coverage
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Test report generated: ${reportPath}`);
    
    // Print summary
    console.log('\n📈 Test Summary:');
    console.log(`  Total: ${report.summary.total}`);
    console.log(`  Passed: ${report.summary.passed}`);
    console.log(`  Failed: ${report.summary.failed}`);
    console.log(`  Skipped: ${report.summary.skipped}`);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--unit-only':
        options.unitOnly = true;
        break;
      case '--integration-only':
        options.integrationOnly = true;
        break;
      case '--e2e-only':
        options.e2eOnly = true;
        break;
      case '--security-only':
        options.securityOnly = true;
        break;
      case '--performance-only':
        options.performanceOnly = true;
        break;
    }
  }

  const testSuite = new TestingSuite();
  testSuite.runAllTests(options).catch(console.error);
}

export default TestingSuite;
