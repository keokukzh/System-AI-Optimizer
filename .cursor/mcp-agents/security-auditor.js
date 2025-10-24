#!/usr/bin/env node

/**
 * Security Auditor Agent (Port 7005)
 * Performs security scans, vulnerability detection, and compliance checks
 */

import { BaseMCPManager } from './base-manager.js';
import { spawn } from 'child_process';
import path from 'path';

export class SecurityAuditorAgent extends BaseMCPManager {
  constructor() {
    super({
      name: 'security-auditor',
      port: 7005,
      description: 'Security scanning and vulnerability detection',
      maxRetries: 3,
      retryDelay: 5000,
      healthCheckInterval: 30000
    });

    this.scanHistory = [];
    this.vulnerabilities = new Map();
  }

  /**
   * Start the security auditor agent process
   */
  async startProcess() {
    this.process = spawn('node', [
      path.join(__dirname, 'servers', 'security-auditor-server.js')
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
   * Scan project for security vulnerabilities
   */
  async scanProject(projectPath, options = {}) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ projectPath, options }),
      `http://localhost:${this.port}/api/scan`
    ]);
    
    const scanResult = JSON.parse(result.stdout);
    this.scanHistory.push({
      timestamp: Date.now(),
      projectPath,
      result: scanResult
    });
    
    // Store vulnerabilities
    if (scanResult.vulnerabilities && scanResult.vulnerabilities.length > 0) {
      scanResult.vulnerabilities.forEach(vuln => {
        this.vulnerabilities.set(vuln.id, vuln);
      });
    }
    
    return scanResult;
  }

  /**
   * Scan dependencies for known vulnerabilities
   */
  async scanDependencies(packageFile) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ packageFile }),
      `http://localhost:${this.port}/api/scan/dependencies`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Perform static code analysis
   */
  async staticAnalysis(filePath, language) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ filePath, language }),
      `http://localhost:${this.port}/api/scan/static`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Check for secrets in code
   */
  async scanSecrets(filePath) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ filePath }),
      `http://localhost:${this.port}/api/scan/secrets`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Perform compliance check
   */
  async complianceCheck(projectPath, standards = ['OWASP', 'CWE']) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ projectPath, standards }),
      `http://localhost:${this.port}/api/scan/compliance`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Get vulnerability report
   */
  async getVulnerabilityReport(format = 'json') {
    const result = await this.executeWithRetry('curl', [
      `http://localhost:${this.port}/api/vulnerabilities?format=${format}`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Get scan history
   */
  getScanHistory() {
    return this.scanHistory;
  }

  /**
   * Get all vulnerabilities
   */
  getVulnerabilities() {
    return Array.from(this.vulnerabilities.values());
  }

  /**
   * Clear scan history
   */
  clearHistory() {
    this.scanHistory = [];
    this.vulnerabilities.clear();
  }
}

export default SecurityAuditorAgent;
