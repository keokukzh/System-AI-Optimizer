#!/usr/bin/env node

/**
 * Docker Orchestrator Agent (Port 7002)
 * Manages Docker containers, images, and orchestration
 */

import { BaseMCPManager } from './base-manager.js';
import { spawn } from 'child_process';
import path from 'path';
import { createLock } from './utils/locks.js';

export class DockerOrchestratorAgent extends BaseMCPManager {
  constructor() {
    super({
      name: 'docker-orchestrator',
      port: 7002,
      description: 'Docker container and orchestration management',
      maxRetries: 3,
      retryDelay: 5000,
      healthCheckInterval: 30000
    });

    this.containers = new Map();
    this.operationLock = createLock();
  }

  /**
   * Start the docker orchestrator agent process
   */
  async startProcess() {
    this.process = spawn('node', [
      path.join(__dirname, 'servers', 'docker-orchestrator-server.js')
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
   * Start a Docker container (thread-safe)
   */
  async startContainer(containerConfig) {
    return await this.operationLock.acquire(async () => {
      const result = await this.executeWithRetry('curl', [
        '-X', 'POST',
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify(containerConfig),
        `http://localhost:${this.port}/api/containers/start`
      ]);
      
      const response = JSON.parse(result.stdout);
      this.containers.set(response.containerId, response);
      return response;
    });
  }

  /**
   * Stop a Docker container (thread-safe)
   */
  async stopContainer(containerId) {
    return await this.operationLock.acquire(async () => {
      const result = await this.executeWithRetry('curl', [
        '-X', 'POST',
        `http://localhost:${this.port}/api/containers/${containerId}/stop`
      ]);
      
      this.containers.delete(containerId);
      return JSON.parse(result.stdout);
    });
  }

  /**
   * List all containers
   */
  async listContainers() {
    const result = await this.executeWithRetry('curl', [
      `http://localhost:${this.port}/api/containers`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Build Docker image
   */
  async buildImage(imageConfig) {
    return await this.operationLock.acquire(async () => {
      const result = await this.executeWithRetry('curl', [
        '-X', 'POST',
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify(imageConfig),
        `http://localhost:${this.port}/api/images/build`
      ]);
      return JSON.parse(result.stdout);
    });
  }

  /**
   * Get container logs
   */
  async getContainerLogs(containerId) {
    const result = await this.executeWithRetry('curl', [
      `http://localhost:${this.port}/api/containers/${containerId}/logs`
    ]);
    return JSON.parse(result.stdout);
  }

  /**
   * Clean up all containers on shutdown
   */
  async cleanup() {
    console.log(`[${this.name}] Cleaning up containers...`);
    
    for (const containerId of this.containers.keys()) {
      try {
        await this.stopContainer(containerId);
      } catch (error) {
        console.error(`[${this.name}] Failed to stop container ${containerId}:`, error);
      }
    }
    
    await super.cleanup();
  }
}

export default DockerOrchestratorAgent;
