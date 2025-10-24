#!/usr/bin/env node

/**
 * Base Manager Class for MCP Agents
 * Provides common functionality for all MCP agent managers
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import http from 'http';

export class BaseMCPManager extends EventEmitter {
  constructor(config) {
    super();
    this.name = config.name;
    this.port = config.port;
    this.description = config.description;
    this.process = null;
    this.isRunning = false;
    this.startTime = null;
    this.sessionId = null;
    this.healthCheckInterval = null;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 5000;
    this.healthCheckIntervalMs = config.healthCheckInterval || 30000;
  }

  /**
   * Start the MCP agent
   */
  async start() {
    if (this.isRunning) {
      console.log(`[${this.name}] Already running on port ${this.port}`);
      return;
    }

    console.log(`[${this.name}] Starting on port ${this.port}...`);
    
    try {
      await this.startProcess();
      this.isRunning = true;
      this.startTime = Date.now();
      this.sessionId = `${this.name}-${Date.now()}`;
      
      // Start health check
      this.startHealthCheck();
      
      this.emit('started', { name: this.name, port: this.port, sessionId: this.sessionId });
      console.log(`[${this.name}] Started successfully on port ${this.port}`);
    } catch (error) {
      console.error(`[${this.name}] Failed to start:`, error);
      throw error;
    }
  }

  /**
   * Stop the MCP agent
   */
  async stop() {
    if (!this.isRunning) {
      console.log(`[${this.name}] Not running`);
      return;
    }

    console.log(`[${this.name}] Stopping...`);
    
    this.stopHealthCheck();
    
    if (this.process) {
      this.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
          resolve();
        }, 5000);
        
        this.process.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
    
    this.isRunning = false;
    this.process = null;
    this.sessionId = null;
    this.startTime = null;
    
    this.emit('stopped', { name: this.name });
    console.log(`[${this.name}] Stopped`);
  }

  /**
   * Restart the MCP agent
   */
  async restart() {
    console.log(`[${this.name}] Restarting...`);
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      name: this.name,
      port: this.port,
      isRunning: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      sessionId: this.sessionId,
      description: this.description
    };
  }

  /**
   * Start process (to be implemented by subclasses)
   */
  async startProcess() {
    throw new Error('startProcess() must be implemented by subclass');
  }

  /**
   * Health check
   */
  async checkHealth() {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${this.port}/health`, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Start health check interval
   */
  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.checkHealth();
      
      if (!isHealthy && this.isRunning) {
        console.warn(`[${this.name}] Health check failed, attempting restart...`);
        this.emit('unhealthy', { name: this.name });
        await this.restart();
      }
    }, this.healthCheckIntervalMs);
  }

  /**
   * Stop health check interval
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Execute a command with retry logic
   */
  async executeWithRetry(command, args = [], retries = this.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.execute(command, args);
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`[${this.name}] Attempt ${i + 1} failed, retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  /**
   * Execute a command
   */
  async execute(command, args = []) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.stop();
    this.removeAllListeners();
  }
}

export default BaseMCPManager;
