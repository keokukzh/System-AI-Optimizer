#!/usr/bin/env node

/**
 * AI Code Generation Agent (Port 7003)
 * Handles AI-powered code generation and refactoring
 */

import { BaseMCPManager } from './base-manager.js';
import { spawn } from 'child_process';
import path from 'path';

export class AICodegenAgent extends BaseMCPManager {
  constructor() {
    super({
      name: 'ai-codegen',
      port: 7003,
      description: 'AI-powered code generation and refactoring',
      maxRetries: 3,
      retryDelay: 5000,
      healthCheckInterval: 30000
    });

    this.generationHistory = [];
  }

  /**
   * Start the AI codegen agent process
   */
  async startProcess() {
    this.process = spawn('node', [
      path.join(__dirname, 'servers', 'ai-codegen-server.js')
    ], {
      env: {
        ...process.env,
        PORT: this.port,
        OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'
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
   * Generate code from natural language prompt
   */
  async generateCode(prompt, language, context = {}) {
    const result = await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ prompt, language, context }),
      `http://localhost:${this.port}/api/generate`
    ]);
    
    const response = JSON.parse(result.stdout);
    this.generationHistory.push({
      timestamp: Date.now(),
      prompt,
      language,
      result: response
    });
    
    return response;
  }

  /**
   * Refactor existing code
   */
  async refactorCode(code, refactorType, instructions) {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ code, refactorType, instructions }),
      `http://localhost:${this.port}/api/refactor`
    ]);
  }

  /**
   * Optimize code for performance
   */
  async optimizeCode(code, language) {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ code, language }),
      `http://localhost:${this.port}/api/optimize`
    ]);
  }

  /**
   * Generate unit tests for code
   */
  async generateTests(code, framework) {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ code, framework }),
      `http://localhost:${this.port}/api/tests/generate`
    ]);
  }

  /**
   * Explain code functionality
   */
  async explainCode(code, language) {
    return await this.executeWithRetry('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ code, language }),
      `http://localhost:${this.port}/api/explain`
    ]);
  }

  /**
   * Get generation history
   */
  getHistory() {
    return this.generationHistory;
  }

  /**
   * Clear generation history
   */
  clearHistory() {
    this.generationHistory = [];
  }
}

export default AICodegenAgent;
