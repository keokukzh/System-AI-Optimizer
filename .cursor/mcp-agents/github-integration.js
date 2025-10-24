#!/usr/bin/env node

/**
 * GitHub Integration Agent (Port 7004)
 * Handles GitHub API operations, PR management, and repository automation
 */

import { BaseMCPManager } from './base-manager.js';
import { spawn } from 'child_process';
import path from 'path';

export class GitHubIntegrationAgent extends BaseMCPManager {
  constructor() {
    super({
      name: 'github-integration',
      port: 7004,
      description: 'GitHub API operations and repository automation',
      maxRetries: 3,
      retryDelay: 5000,
      healthCheckInterval: 30000
    });
  }

  /**
   * Start the GitHub integration agent process
   */
  async startProcess() {
    if (!process.env.GITHUB_TOKEN) {
      console.warn(`[${this.name}] GITHUB_TOKEN not set, some operations may fail`);
    }

    this.process = spawn('node', [
      path.join(__dirname, 'servers', 'github-integration-server.js')
    ], {
      env: {
        ...process.env,
        PORT: this.port,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN
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
   * Create a pull request
   */
  async createPullRequest(owner, repo, data) {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ owner, repo, ...data }),
      `http://localhost:${this.port}/api/pull-requests`
    ]);
  }

  /**
   * Get repository information
   */
  async getRepository(owner, repo) {
    const result = await this.executeWithRetry('curl', [
      `http://localhost:${this.port}/api/repos/${owner}/${repo}`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * List repository issues
   */
  async listIssues(owner, repo, state = 'open') {
    const result = await this.executeWithRetry('curl', [
      `http://localhost:${this.port}/api/repos/${owner}/${repo}/issues?state=${state}`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Create an issue
   */
  async createIssue(owner, repo, issueData) {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ owner, repo, ...issueData }),
      `http://localhost:${this.port}/api/repos/${owner}/${repo}/issues`
    ]);
  }

  /**
   * Merge a pull request
   */
  async mergePullRequest(owner, repo, pullNumber, mergeMethod = 'merge') {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ mergeMethod }),
      `http://localhost:${this.port}/api/repos/${owner}/${repo}/pulls/${pullNumber}/merge`
    ]);
  }

  /**
   * Create a release
   */
  async createRelease(owner, repo, releaseData) {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ owner, repo, ...releaseData }),
      `http://localhost:${this.port}/api/repos/${owner}/${repo}/releases`
    ]);
  }

  /**
   * Get workflow runs
   */
  async getWorkflowRuns(owner, repo, workflowId) {
    const result = await this.executeWithRetry('curl', [
      `http://localhost:${this.port}/api/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Trigger workflow dispatch
   */
  async triggerWorkflow(owner, repo, workflowId, ref = 'main', inputs = {}) {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ ref, inputs }),
      `http://localhost:${this.port}/api/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`
    ]);
  }
}

export default GitHubIntegrationAgent;
