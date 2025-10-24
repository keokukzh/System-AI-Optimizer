#!/usr/bin/env node

/**
 * MCP Agent Orchestrator
 * Manages all MCP agents (ports 7001-7007)
 */

import ProjectManagerAgent from './project-manager.js';
import DockerOrchestratorAgent from './docker-orchestrator.js';
import AICodegenAgent from './ai-codegen.js';
import GitHubIntegrationAgent from './github-integration.js';
import SecurityAuditorAgent from './security-auditor.js';
import TestSuiteRunnerAgent from './test-suite-runner.js';
import DeploymentOptimizerAgent from './deployment-optimizer.js';
import { SessionManager } from './utils/locks.js';

export class MCPAgentOrchestrator {
  constructor() {
    this.agents = new Map();
    this.sessionManager = new SessionManager();
    this.isInitialized = false;

    // Initialize all agents
    this.agents.set('project-manager', new ProjectManagerAgent());
    this.agents.set('docker-orchestrator', new DockerOrchestratorAgent());
    this.agents.set('ai-codegen', new AICodegenAgent());
    this.agents.set('github-integration', new GitHubIntegrationAgent());
    this.agents.set('security-auditor', new SecurityAuditorAgent());
    this.agents.set('test-suite-runner', new TestSuiteRunnerAgent());
    this.agents.set('deployment-optimizer', new DeploymentOptimizerAgent());

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for all agents
   */
  setupEventListeners() {
    for (const [name, agent] of this.agents.entries()) {
      agent.on('started', (data) => {
        console.log(`✅ Agent ${data.name} started successfully`);
      });

      agent.on('stopped', (data) => {
        console.log(`⏹️  Agent ${data.name} stopped`);
      });

      agent.on('crashed', (data) => {
        console.error(`❌ Agent ${data.name} crashed with code ${data.code}`);
        // Attempt to restart crashed agent
        this.restartAgent(name);
      });

      agent.on('unhealthy', (data) => {
        console.warn(`⚠️  Agent ${data.name} is unhealthy`);
      });
    }
  }

  /**
   * Start all MCP agents
   */
  async startAll() {
    console.log('🚀 Starting MCP Agent Orchestrator...\n');

    const startPromises = [];
    for (const [name, agent] of this.agents.entries()) {
      console.log(`Starting ${name}...`);
      startPromises.push(
        agent.start().catch(error => {
          console.error(`Failed to start ${name}:`, error);
          return { name, error };
        })
      );
    }

    const results = await Promise.allSettled(startPromises);
    
    // Check for failures
    const failures = results.filter(r => r.status === 'rejected' || r.value?.error);
    if (failures.length > 0) {
      console.warn(`\n⚠️  ${failures.length} agent(s) failed to start`);
      failures.forEach(f => {
        const error = f.reason || f.value?.error;
        console.error(`  - ${f.value?.name || 'Unknown'}: ${error?.message || error}`);
      });
    }

    this.isInitialized = true;
    console.log('\n✅ MCP Agent Orchestrator started successfully');
    this.printStatus();
  }

  /**
   * Stop all MCP agents
   */
  async stopAll() {
    console.log('\n⏹️  Stopping MCP Agent Orchestrator...\n');

    const stopPromises = [];
    for (const [name, agent] of this.agents.entries()) {
      console.log(`Stopping ${name}...`);
      stopPromises.push(
        agent.stop().catch(error => {
          console.error(`Failed to stop ${name}:`, error);
        })
      );
    }

    await Promise.all(stopPromises);
    this.isInitialized = false;
    console.log('\n✅ MCP Agent Orchestrator stopped');
  }

  /**
   * Restart a specific agent
   */
  async restartAgent(agentName) {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    console.log(`\n🔄 Restarting ${agentName}...`);
    await agent.restart();
    console.log(`✅ ${agentName} restarted successfully`);
  }

  /**
   * Get agent by name
   */
  getAgent(agentName) {
    return this.agents.get(agentName);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.entries()).map(([name, agent]) => ({
      name,
      agent
    }));
  }

  /**
   * Get status of all agents
   */
  getStatus() {
    const status = {};
    for (const [name, agent] of this.agents.entries()) {
      status[name] = agent.getStatus();
    }
    return status;
  }

  /**
   * Print status of all agents
   */
  printStatus() {
    console.log('\n📊 Agent Status:');
    console.log('═══════════════════════════════════════════════════════════════');
    
    for (const [name, agent] of this.agents.entries()) {
      const status = agent.getStatus();
      const statusIcon = status.isRunning ? '🟢' : '🔴';
      const uptime = status.isRunning 
        ? `${Math.floor(status.uptime / 1000)}s` 
        : 'N/A';
      
      console.log(`${statusIcon} ${name.padEnd(25)} Port: ${status.port}  Uptime: ${uptime}`);
    }
    
    console.log('═══════════════════════════════════════════════════════════════\n');
  }

  /**
   * Health check all agents
   */
  async healthCheck() {
    const results = {};
    
    for (const [name, agent] of this.agents.entries()) {
      results[name] = await agent.checkHealth();
    }
    
    return results;
  }

  /**
   * Clean up all agents
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up all agents...');
    
    for (const [name, agent] of this.agents.entries()) {
      try {
        await agent.cleanup();
      } catch (error) {
        console.error(`Failed to cleanup ${name}:`, error);
      }
    }
    
    await this.sessionManager.clear();
    console.log('✅ Cleanup complete');
  }
}

// Singleton instance
let orchestratorInstance = null;

/**
 * Get orchestrator instance
 */
export function getOrchestrator() {
  if (!orchestratorInstance) {
    orchestratorInstance = new MCPAgentOrchestrator();
  }
  return orchestratorInstance;
}

/**
 * CLI entry point
 */
async function main() {
  const orchestrator = getOrchestrator();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Received SIGINT, shutting down gracefully...');
    await orchestrator.cleanup();
    await orchestrator.stopAll();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n⚠️  Received SIGTERM, shutting down gracefully...');
    await orchestrator.cleanup();
    await orchestrator.stopAll();
    process.exit(0);
  });

  try {
    await orchestrator.startAll();

    // Keep process alive
    setInterval(async () => {
      const health = await orchestrator.healthCheck();
      const unhealthyAgents = Object.entries(health)
        .filter(([_, isHealthy]) => !isHealthy)
        .map(([name]) => name);
      
      if (unhealthyAgents.length > 0) {
        console.warn(`⚠️  Unhealthy agents: ${unhealthyAgents.join(', ')}`);
      }
    }, 60000); // Check every minute

  } catch (error) {
    console.error('❌ Failed to start orchestrator:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MCPAgentOrchestrator;
