#!/usr/bin/env node

/**
 * Test Suite Runner Agent (Port 7006)
 * Executes and manages test suites across different frameworks
 */

import { BaseMCPManager } from './base-manager.js';
import { spawn } from 'child_process';
import path from 'path';

export class TestSuiteRunnerAgent extends BaseMCPManager {
  constructor() {
    super({
      name: 'test-suite-runner',
      port: 7006,
      description: 'Test suite execution and management',
      maxRetries: 3,
      retryDelay: 5000,
      healthCheckInterval: 30000
    });

    this.testRuns = [];
    this.testResults = new Map();
  }

  /**
   * Start the test suite runner agent process
   */
  async startProcess() {
    this.process = spawn('node', [
      path.join(__dirname, 'servers', 'test-suite-runner-server.js')
    ], {
      env: {
        ...process.env,
        PORT: this.port
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      console.log(`[${this.name}]`, data.toString().trim());
    });

    this.process.stderr.on('data', (data) => {
      console.error(`[${this.name}]`, data.toString().trim());
    });

    this.process.on('exit', (code) => {
      if (this.isRunning) {
        console.error(`[${this.name}] Process exited unexpectedly with code ${code}`);
        this.isRunning = false;
        this.emit('crashed', { name: this.name, code });
      }
    });

    await this.waitForReady();
  }

  /**
   * Wait for server to be ready
   */
  async waitForReady(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const isHealthy = await this.checkHealth();
        if (isHealthy) return;
      } catch (error) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`[${this.name}] Server failed to start within ${timeout}ms`);
  }

  /**
   * Run test suite
   */
  async runTests(testConfig) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(testConfig),
      `http://localhost:${this.port}/api/tests/run`
    ]);
    
    const testResult = JSON.parse(result.stdout);
    const runId = testResult.runId || Date.now().toString();
    
    this.testRuns.push({
      runId,
      timestamp: Date.now(),
      config: testConfig,
      result: testResult
    });
    
    this.testResults.set(runId, testResult);
    
    return testResult;
  }

  /**
   * Run Python tests
   */
  async runPythonTests(testPath, options = {}) {
    return await this.runTests({
      type: 'python',
      path: testPath,
      framework: 'pytest',
      ...options
    });
  }

  /**
   * Run JavaScript tests
   */
  async runJavaScriptTests(testPath, options = {}) {
    return await this.runTests({
      type: 'javascript',
      path: testPath,
      framework: options.framework || 'vitest',
      ...options
    });
  }

  /**
   * Run Rust tests
   */
  async runRustTests(testPath, options = {}) {
    return await this.runTests({
      type: 'rust',
      path: testPath,
      framework: 'cargo-test',
      ...options
    });
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests(testConfig) {
    return await this.runTests({
      ...testConfig,
      type: 'integration'
    });
  }

  /**
   * Run E2E tests
   */
  async runE2ETests(testConfig) {
    return await this.runTests({
      ...testConfig,
      type: 'e2e',
      framework: 'playwright'
    });
  }

  /**
   * Get test coverage
   */
  async getCoverage(runId) {
    const result = await this.executeWithRetry('curl', [
      `http://localhost:${this.port}/api/tests/coverage/${runId}`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Get test results
   */
  async getTestResults(runId) {
    if (runId) {
      return this.testResults.get(runId);
    }
    return Array.from(this.testResults.values());
  }

  /**
   * Get test run history
   */
  getTestHistory() {
    return this.testRuns;
  }

  /**
   * Generate test report
   */
  async generateReport(runId, format = 'html') {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ runId, format }),
      `http://localhost:${this.port}/api/tests/report`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Run all project tests
   */
  async runAllTests() {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      `http://localhost:${this.port}/api/tests/run-all`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Clear test history
   */
  clearHistory() {
    this.testRuns = [];
    this.testResults.clear();
  }
}

export default TestSuiteRunnerAgent;
