# MCP Agent Infrastructure

This directory contains the Model Context Protocol (MCP) agent infrastructure for OptiAI, providing specialized agents for project management, deployment, testing, and more.

## Architecture

The MCP agent system is built on a modular architecture with:

- **Base Manager Class**: Common functionality for all agents (health checks, retries, session management)
- **Individual Agent Managers**: Specialized managers for each domain (7 agents total)
- **Orchestrator**: Central management for all agents
- **Thread-Safe Utilities**: Lock and SessionManager for concurrent operations

## Available Agents

### 1. Project Manager Agent (Port 7001)
**Purpose**: Project planning, task management, and resource allocation

**Features**:
- Create and track project tasks
- Analyze project structure
- Generate project plans
- Monitor project status

**API Endpoints**:
- `POST /api/tasks` - Create a new task
- `GET /api/status` - Get project status
- `POST /api/analyze` - Analyze project structure
- `POST /api/plan` - Generate project plan

### 2. Docker Orchestrator Agent (Port 7002)
**Purpose**: Docker container and orchestration management

**Features**:
- Start/stop containers (thread-safe)
- Build Docker images
- List containers
- View container logs
- Auto-cleanup on shutdown

**API Endpoints**:
- `POST /api/containers/start` - Start a container
- `POST /api/containers/{id}/stop` - Stop a container
- `GET /api/containers` - List all containers
- `POST /api/images/build` - Build Docker image
- `GET /api/containers/{id}/logs` - Get container logs

### 3. AI Code Generation Agent (Port 7003)
**Purpose**: AI-powered code generation and refactoring

**Features**:
- Generate code from natural language
- Refactor existing code
- Optimize code for performance
- Generate unit tests
- Explain code functionality

**API Endpoints**:
- `POST /api/generate` - Generate code from prompt
- `POST /api/refactor` - Refactor existing code
- `POST /api/optimize` - Optimize code
- `POST /api/tests/generate` - Generate unit tests
- `POST /api/explain` - Explain code

### 4. GitHub Integration Agent (Port 7004)
**Purpose**: GitHub API operations and repository automation

**Features**:
- Create/manage pull requests
- Create/manage issues
- Merge pull requests
- Create releases
- Trigger workflows
- Get repository information

**API Endpoints**:
- `POST /api/pull-requests` - Create a pull request
- `GET /api/repos/{owner}/{repo}` - Get repository info
- `GET /api/repos/{owner}/{repo}/issues` - List issues
- `POST /api/repos/{owner}/{repo}/issues` - Create issue
- `POST /api/repos/{owner}/{repo}/pulls/{number}/merge` - Merge PR
- `POST /api/repos/{owner}/{repo}/releases` - Create release
- `POST /api/repos/{owner}/{repo}/actions/workflows/{id}/dispatches` - Trigger workflow

### 5. Security Auditor Agent (Port 7005)
**Purpose**: Security scanning and vulnerability detection

**Features**:
- Scan projects for vulnerabilities
- Dependency security analysis
- Static code analysis
- Secret detection
- Compliance checks (OWASP, CWE)
- Generate vulnerability reports

**API Endpoints**:
- `POST /api/scan` - Scan project for vulnerabilities
- `POST /api/scan/dependencies` - Scan dependencies
- `POST /api/scan/static` - Static code analysis
- `POST /api/scan/secrets` - Scan for secrets
- `POST /api/scan/compliance` - Compliance check
- `GET /api/vulnerabilities` - Get vulnerability report

### 6. Test Suite Runner Agent (Port 7006)
**Purpose**: Test suite execution and management

**Features**:
- Run Python/JavaScript/Rust tests
- Integration and E2E testing
- Test coverage reports
- Test result tracking
- Generate test reports

**API Endpoints**:
- `POST /api/tests/run` - Run test suite
- `GET /api/tests/coverage/{runId}` - Get coverage
- `GET /api/tests/results/{runId}` - Get test results
- `POST /api/tests/report` - Generate test report
- `POST /api/tests/run-all` - Run all project tests

### 7. Deployment Optimizer Agent (Port 7007)
**Purpose**: Deployment optimization and release management

**Features**:
- Create deployments
- Deploy to environments (dev/staging/prod)
- Rollback deployments
- Build optimization
- Performance analysis
- Release management

**API Endpoints**:
- `POST /api/deployments` - Create deployment
- `POST /api/deployments/{id}/rollback` - Rollback deployment
- `GET /api/deployments/{id}/status` - Get deployment status
- `POST /api/optimize/build` - Optimize build
- `GET /api/deployments/{id}/performance` - Analyze performance
- `POST /api/releases` - Create release

## Usage

### Starting All Agents

```bash
cd .cursor/mcp-agents
node orchestrator.js
```

### Starting Individual Agents

```javascript
import ProjectManagerAgent from './project-manager.js';

const agent = new ProjectManagerAgent();
await agent.start();

// Use the agent
const status = await agent.getProjectStatus();

// Stop when done
await agent.stop();
```

### Using the Orchestrator

```javascript
import { getOrchestrator } from './orchestrator.js';

const orchestrator = getOrchestrator();

// Start all agents
await orchestrator.startAll();

// Get specific agent
const projectManager = orchestrator.getAgent('project-manager');

// Get status of all agents
const status = orchestrator.getStatus();

// Restart a specific agent
await orchestrator.restartAgent('docker-orchestrator');

// Stop all agents
await orchestrator.stopAll();
```

## Thread Safety

The infrastructure includes thread-safe operations:

### Lock Utility

```javascript
import { createLock } from './utils/locks.js';

const lock = createLock();

// Execute operations with lock
await lock.acquire(async () => {
  // Critical section - only one execution at a time
  await someAsyncOperation();
});
```

### Session Manager

```javascript
import { SessionManager } from './utils/locks.js';

const sessionManager = new SessionManager();

// Create session (thread-safe)
await sessionManager.create('session-id', { data: 'value' });

// Update session (thread-safe)
await sessionManager.update('session-id', { newData: 'newValue' });

// Get session
const session = await sessionManager.get('session-id');
```

## Testing

Run the test suite:

```bash
cd /home/runner/work/System-AI-Optimizer/System-AI-Optimizer
npx vitest run .cursor/mcp-agents/tests/managers.test.js
```

## Health Checks

All agents implement automatic health checks:

- **Interval**: 30 seconds (configurable)
- **Auto-Restart**: Agents automatically restart if health check fails
- **Retry Logic**: Operations retry up to 3 times with exponential backoff

## Configuration

Each agent can be configured with:

```javascript
{
  name: 'agent-name',
  port: 7001,
  description: 'Agent description',
  maxRetries: 3,
  retryDelay: 5000,
  healthCheckInterval: 30000
}
```

## Event System

Agents emit events for monitoring:

- `started`: Agent has started successfully
- `stopped`: Agent has stopped
- `crashed`: Agent process crashed
- `unhealthy`: Health check failed

## Security Considerations

1. **Port Binding**: Agents bind to localhost by default
2. **Authentication**: Implement authentication for production use
3. **Rate Limiting**: Configure rate limits for API endpoints
4. **Input Validation**: All inputs are validated before processing
5. **Secrets Management**: Use environment variables for sensitive data

## Dependencies

- Node.js 18+
- npm packages: (installed in parent project)
  - `vitest` (for testing)

## Integration with OptiAI

The MCP agents integrate with OptiAI's existing infrastructure:

- **Backend API**: Agents can call OptiAI backend endpoints
- **Frontend**: Frontend can call agent APIs via proxy
- **Tauri**: Desktop app can spawn agent processes
- **CI/CD**: Agents used in GitHub Actions workflows

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Distributed agent deployment
- [ ] Advanced metrics and monitoring
- [ ] Plugin system for custom agents
- [ ] gRPC support for inter-agent communication
- [ ] Kubernetes deployment support

## Troubleshooting

### Agent Won't Start

1. Check if port is already in use: `lsof -i :7001`
2. Verify Node.js version: `node --version` (should be 18+)
3. Check agent logs for errors

### Health Check Failing

1. Ensure agent server is implementing `/health` endpoint
2. Check firewall rules
3. Verify network connectivity

### Agent Crashes

1. Check agent logs for errors
2. Verify system resources (memory, CPU)
3. Check for conflicting processes

## License

MIT License - See parent project LICENSE file

## Contributing

See parent project CONTRIBUTING.md for guidelines
