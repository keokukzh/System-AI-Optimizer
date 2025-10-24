#!/usr/bin/env node

/**
 * Project Manager Agent (Port 7001)
 * Handles project planning, task management, and resource allocation
 */

import { BaseMCPManager } from './base-manager.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export class ProjectManagerAgent extends BaseMCPManager {
  constructor() {
    super({
      name: 'project-manager',
      port: 7001,
      description: 'Project planning, task management, and resource allocation',
      maxRetries: 3,
      retryDelay: 5000,
      healthCheckInterval: 30000
    });

    this.projectRoot = process.cwd();
    this.projectDataPath = path.join(this.projectRoot, '.project-management');
  }

  /**
   * Start the project manager agent process
   */
  async startProcess() {
    // Ensure project data directory exists
    if (!fs.existsSync(this.projectDataPath)) {
      fs.mkdirSync(this.projectDataPath, { recursive: true });
    }

    this.process = spawn('node', [
      path.join(__dirname, 'servers', 'project-manager-server.js')
    ], {
      env: {
        ...process.env,
        PORT: this.port,
        PROJECT_ROOT: this.projectRoot,
        PROJECT_DATA_PATH: this.projectDataPath
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

    // Wait for server to be ready
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
   * Create a new project task
   */
  async createTask(task) {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(task),
      `http://localhost:${this.port}/api/tasks`
    ]);
  }

  /**
   * Get project status
   */
  async getProjectStatus() {
    const result = await this.executeWithRetry('curl', [
      `http://localhost:${this.port}/api/status`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Analyze project structure
   */
  async analyzeProject() {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      `http://localhost:${this.port}/api/analyze`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Generate project plan
   */
  async generatePlan(requirements) {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(requirements),
      `http://localhost:${this.port}/api/plan`
    ]);
  }
}

export default ProjectManagerAgent;
