#!/usr/bin/env node

/**
 * Deployment Optimizer Agent (Port 7007)
 * Optimizes deployment processes, manages releases, and handles rollbacks
 */

import { BaseMCPManager } from './base-manager.js';
import { spawn } from 'child_process';
import path from 'path';

export class DeploymentOptimizerAgent extends BaseMCPManager {
  constructor() {
    super({
      name: 'deployment-optimizer',
      port: 7007,
      description: 'Deployment optimization and release management',
      maxRetries: 3,
      retryDelay: 5000,
      healthCheckInterval: 30000
    });

    this.deployments = new Map();
    this.releaseHistory = [];
  }

  /**
   * Start the deployment optimizer agent process
   */
  async startProcess() {
    this.process = spawn('node', [
      path.join(__dirname, 'servers', 'deployment-optimizer-server.js')
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
   * Create a new deployment
   */
  async createDeployment(deploymentConfig) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(deploymentConfig),
      `http://localhost:${this.port}/api/deployments`
    ]);
    
    const deployment = JSON.parse(result.stdout);
    this.deployments.set(deployment.id, deployment);
    
    return deployment;
  }

  /**
   * Deploy to environment
   */
  async deploy(environment, version, options = {}) {
    return await this.createDeployment({
      environment,
      version,
      ...options
    });
  }

  /**
   * Rollback deployment
   */
  async rollback(deploymentId, targetVersion) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ targetVersion }),
      `http://localhost:${this.port}/api/deployments/${deploymentId}/rollback`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId) {
    const result = await this.executeWithRetry('curl', [
      `http://localhost:${this.port}/api/deployments/${deploymentId}/status`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Optimize build for deployment
   */
  async optimizeBuild(buildConfig) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(buildConfig),
      `http://localhost:${this.port}/api/optimize/build`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Analyze deployment performance
   */
  async analyzePerformance(deploymentId) {
    const result = await this.executeWithRetry('curl', [
      `http://localhost:${this.port}/api/deployments/${deploymentId}/performance`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Create release
   */
  async createRelease(releaseData) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(releaseData),
      `http://localhost:${this.port}/api/releases`
    ]);
    
    const release = JSON.parse(result.stdout);
    this.releaseHistory.push({
      timestamp: Date.now(),
      release
    });
    
    return release;
  }

  /**
   * Get release history
   */
  getReleaseHistory() {
    return this.releaseHistory;
  }

  /**
   * Get all deployments
   */
  getDeployments() {
    return Array.from(this.deployments.values());
  }

  /**
   * Get deployment by ID
   */
  getDeployment(deploymentId) {
    return this.deployments.get(deploymentId);
  }

  /**
   * Cancel deployment
   */
  async cancelDeployment(deploymentId) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      `http://localhost:${this.port}/api/deployments/${deploymentId}/cancel`
    ]);
    
    this.deployments.delete(deploymentId);
    return JSON.parse(result.stdout);
  }

  /**
   * Clean up deployments on shutdown
   */
  async cleanup() {
    console.log(`[${this.name}] Cleaning up deployments...`);
    
    for (const deployment of this.deployments.values()) {
      if (deployment.status === 'in-progress') {
        try {
          await this.cancelDeployment(deployment.id);
        } catch (error) {
          console.error(`[${this.name}] Failed to cancel deployment ${deployment.id}:`, error);
        }
      }
    }
    
    await super.cleanup();
  }
}

export default DeploymentOptimizerAgent;
