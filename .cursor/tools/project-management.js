#!/usr/bin/env node

/**
 * Project Management Suite for OptiAI
 * Comprehensive project planning, tracking, and automation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class ProjectManagementSuite {
  constructor() {
    this.projectRoot = process.cwd();
    this.projectData = {
      name: 'OptiAI',
      version: '1.0.0',
      description: 'AI-powered desktop system optimizer',
      milestones: [],
      tasks: [],
      dependencies: [],
      risks: [],
      resources: []
    };
  }

  /**
   * Initialize project management structure
   */
  async initialize() {
    console.log('📋 Initializing project management suite...\n');
    
    await this.createProjectStructure();
    await this.analyzeProject();
    await this.generateProjectPlan();
    await this.setupTracking();
    
    console.log('✅ Project management suite initialized successfully!');
  }

  /**
   * Create project management directory structure
   */
  async createProjectStructure() {
    const pmDir = path.join(this.projectRoot, '.project-management');
    const dirs = [
      'milestones',
      'tasks',
      'dependencies',
      'risks',
      'resources',
      'reports',
      'templates'
    ];

    if (!fs.existsSync(pmDir)) {
      fs.mkdirSync(pmDir, { recursive: true });
    }

    for (const dir of dirs) {
      const dirPath = path.join(pmDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    console.log('  📁 Project management structure created');
  }

  /**
   * Analyze current project state
   */
  async analyzeProject() {
    console.log('🔍 Analyzing project structure...');
    
    const analysis = {
      codebase: await this.analyzeCodebase(),
      dependencies: await this.analyzeDependencies(),
      tests: await this.analyzeTests(),
      documentation: await this.analyzeDocumentation(),
      build: await this.analyzeBuild(),
      deployment: await this.analyzeDeployment()
    };

    const analysisPath = path.join(this.projectRoot, '.project-management', 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    
    console.log('  ✅ Project analysis completed');
    return analysis;
  }

  /**
   * Analyze codebase structure and complexity
   */
  async analyzeCodebase() {
    const codebase = {
      frontend: { files: 0, lines: 0, components: 0 },
      backend: { files: 0, lines: 0, modules: 0 },
      desktop: { files: 0, lines: 0, modules: 0 },
      total: { files: 0, lines: 0 }
    };

    // Analyze frontend
    if (fs.existsSync('src')) {
      const frontendStats = this.analyzeDirectory('src');
      codebase.frontend = frontendStats;
    }

    // Analyze backend
    if (fs.existsSync('backend')) {
      const backendStats = this.analyzeDirectory('backend');
      codebase.backend = backendStats;
    }

    // Analyze desktop (Tauri)
    if (fs.existsSync('src-tauri')) {
      const desktopStats = this.analyzeDirectory('src-tauri');
      codebase.desktop = desktopStats;
    }

    // Calculate totals
    codebase.total.files = codebase.frontend.files + codebase.backend.files + codebase.desktop.files;
    codebase.total.lines = codebase.frontend.lines + codebase.backend.lines + codebase.desktop.lines;

    return codebase;
  }

  /**
   * Analyze directory structure and file statistics
   */
  analyzeDirectory(dirPath) {
    const stats = { files: 0, lines: 0, components: 0, modules: 0 };
    
    if (!fs.existsSync(dirPath)) {
      return stats;
    }

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const fileStats = fs.statSync(fullPath);
      
      if (fileStats.isDirectory()) {
        const subStats = this.analyzeDirectory(fullPath);
        stats.files += subStats.files;
        stats.lines += subStats.lines;
        stats.components += subStats.components;
        stats.modules += subStats.modules;
      } else if (fileStats.isFile()) {
        stats.files++;
        
        // Count lines for text files
        if (this.isTextFile(file)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            stats.lines += content.split('\n').length;
          } catch (error) {
            // Skip files that can't be read as text
          }
        }

        // Count components and modules
        if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
          stats.components++;
        } else if (file.endsWith('.py') || file.endsWith('.rs')) {
          stats.modules++;
        }
      }
    }

    return stats;
  }

  /**
   * Check if file is a text file
   */
  isTextFile(filename) {
    const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.rs', '.json', '.yaml', '.yml', '.md', '.txt', '.css', '.html'];
    return textExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Analyze project dependencies
   */
  async analyzeDependencies() {
    const dependencies = {
      frontend: [],
      backend: [],
      desktop: [],
      total: 0
    };

    // Frontend dependencies
    if (fs.existsSync('package.json')) {
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        dependencies.frontend = Object.keys(packageJson.dependencies || {});
        dependencies.total += dependencies.frontend.length;
      } catch (error) {
        console.warn('  ⚠️  Could not parse package.json');
      }
    }

    // Backend dependencies
    if (fs.existsSync('backend/requirements.txt')) {
      try {
        const requirements = fs.readFileSync('backend/requirements.txt', 'utf8');
        dependencies.backend = requirements.split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim());
        dependencies.total += dependencies.backend.length;
      } catch (error) {
        console.warn('  ⚠️  Could not parse requirements.txt');
      }
    }

    // Desktop dependencies (Cargo.toml)
    if (fs.existsSync('src-tauri/Cargo.toml')) {
      try {
        const cargoToml = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
        const lines = cargoToml.split('\n');
        const deps = [];
        let inDependencies = false;
        
        for (const line of lines) {
          if (line.trim() === '[dependencies]') {
            inDependencies = true;
            continue;
          }
          if (inDependencies && line.trim().startsWith('[')) {
            break;
          }
          if (inDependencies && line.trim() && !line.startsWith('#')) {
            const dep = line.split('=')[0].trim();
            if (dep) deps.push(dep);
          }
        }
        
        dependencies.desktop = deps;
        dependencies.total += dependencies.desktop.length;
      } catch (error) {
        console.warn('  ⚠️  Could not parse Cargo.toml');
      }
    }

    return dependencies;
  }

  /**
   * Analyze test coverage and structure
   */
  async analyzeTests() {
    const tests = {
      unit: { files: 0, coverage: 0 },
      integration: { files: 0, coverage: 0 },
      e2e: { files: 0, coverage: 0 },
      total: { files: 0, coverage: 0 }
    };

    // Count test files
    const testDirs = ['tests', 'src/tests', 'backend/tests'];
    for (const testDir of testDirs) {
      if (fs.existsSync(testDir)) {
        const testFiles = this.findTestFiles(testDir);
        tests.unit.files += testFiles.unit;
        tests.integration.files += testFiles.integration;
        tests.e2e.files += testFiles.e2e;
      }
    }

    tests.total.files = tests.unit.files + tests.integration.files + tests.e2e.files;

    return tests;
  }

  /**
   * Find test files in directory
   */
  findTestFiles(dirPath) {
    const testFiles = { unit: 0, integration: 0, e2e: 0 };
    
    if (!fs.existsSync(dirPath)) {
      return testFiles;
    }

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const fileStats = fs.statSync(fullPath);
      
      if (fileStats.isDirectory()) {
        const subFiles = this.findTestFiles(fullPath);
        testFiles.unit += subFiles.unit;
        testFiles.integration += subFiles.integration;
        testFiles.e2e += subFiles.e2e;
      } else if (fileStats.isFile()) {
        if (file.includes('test') || file.includes('spec')) {
          if (file.includes('integration') || file.includes('e2e')) {
            testFiles.integration++;
          } else if (file.includes('e2e') || file.includes('playwright')) {
            testFiles.e2e++;
          } else {
            testFiles.unit++;
          }
        }
      }
    }

    return testFiles;
  }

  /**
   * Analyze documentation completeness
   */
  async analyzeDocumentation() {
    const documentation = {
      readme: fs.existsSync('README.md'),
      changelog: fs.existsSync('CHANGELOG.md'),
      api: fs.existsSync('docs/api') || fs.existsSync('API.md'),
      architecture: fs.existsSync('docs/architecture') || fs.existsSync('ARCHITECTURE.md'),
      deployment: fs.existsSync('docs/deployment') || fs.existsSync('DEPLOYMENT.md'),
      testing: fs.existsSync('docs/testing') || fs.existsSync('TESTING.md'),
      total: 0
    };

    documentation.total = Object.values(documentation).filter(Boolean).length;
    return documentation;
  }

  /**
   * Analyze build configuration
   */
  async analyzeBuild() {
    const build = {
      frontend: fs.existsSync('vite.config.js') || fs.existsSync('webpack.config.js'),
      backend: fs.existsSync('backend/main.py') || fs.existsSync('backend/app.py'),
      desktop: fs.existsSync('src-tauri/tauri.conf.json'),
      docker: fs.existsSync('Dockerfile') || fs.existsSync('docker-compose.yml'),
      makefile: fs.existsSync('Makefile'),
      scripts: fs.existsSync('scripts'),
      total: 0
    };

    build.total = Object.values(build).filter(Boolean).length;
    return build;
  }

  /**
   * Analyze deployment configuration
   */
  async analyzeDeployment() {
    const deployment = {
      ci: fs.existsSync('.github/workflows') || fs.existsSync('.gitlab-ci.yml'),
      docker: fs.existsSync('Dockerfile'),
      kubernetes: fs.existsSync('k8s') || fs.existsSync('kubernetes'),
      terraform: fs.existsSync('terraform'),
      ansible: fs.existsSync('ansible'),
      total: 0
    };

    deployment.total = Object.values(deployment).filter(Boolean).length;
    return deployment;
  }

  /**
   * Generate comprehensive project plan
   */
  async generateProjectPlan() {
    console.log('📋 Generating project plan...');
    
    const plan = {
      phases: [
        {
          name: 'Foundation',
          description: 'Core infrastructure and basic functionality',
          tasks: [
            'Set up development environment',
            'Implement basic UI components',
            'Create backend API structure',
            'Set up testing framework',
            'Configure build system'
          ],
          duration: '2-3 weeks',
          priority: 'high'
        },
        {
          name: 'Core Features',
          description: 'Main application functionality',
          tasks: [
            'Implement file scanning',
            'Create AI optimization engine',
            'Build action execution system',
            'Add undo functionality',
            'Implement security policies'
          ],
          duration: '4-6 weeks',
          priority: 'high'
        },
        {
          name: 'Advanced Features',
          description: 'Enhanced functionality and integrations',
          tasks: [
            'Add AI tool recommender',
            'Implement GitHub auto-installer',
            'Create secure vault',
            'Add process management',
            'Build startup manager'
          ],
          duration: '3-4 weeks',
          priority: 'medium'
        },
        {
          name: 'Polish & Release',
          description: 'Final testing, optimization, and release',
          tasks: [
            'Comprehensive testing',
            'Performance optimization',
            'Security audit',
            'Documentation completion',
            'Release preparation'
          ],
          duration: '2-3 weeks',
          priority: 'high'
        }
      ],
      milestones: [
        { name: 'MVP Release', date: '4 weeks', status: 'completed' },
        { name: 'Beta Release', date: '8 weeks', status: 'in-progress' },
        { name: 'Production Release', date: '12 weeks', status: 'planned' }
      ],
      risks: [
        {
          name: 'AI Model Integration',
          description: 'Complexity of integrating local LLM models',
          probability: 'medium',
          impact: 'high',
          mitigation: 'Use Ollama for simplified integration'
        },
        {
          name: 'Cross-platform Compatibility',
          description: 'Ensuring consistent behavior across platforms',
          probability: 'medium',
          impact: 'medium',
          mitigation: 'Extensive testing on all target platforms'
        },
        {
          name: 'Security Vulnerabilities',
          description: 'Potential security issues in file operations',
          probability: 'low',
          impact: 'high',
          mitigation: 'Comprehensive security testing and policy validation'
        }
      ]
    };

    const planPath = path.join(this.projectRoot, '.project-management', 'project-plan.json');
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    
    console.log('  ✅ Project plan generated');
    return plan;
  }

  /**
   * Set up project tracking and monitoring
   */
  async setupTracking() {
    console.log('📊 Setting up project tracking...');
    
    const tracking = {
      metrics: {
        codeQuality: { target: 90, current: 0 },
        testCoverage: { target: 80, current: 0 },
        performance: { target: 100, current: 0 },
        security: { target: 100, current: 0 }
      },
      progress: {
        foundation: 100,
        coreFeatures: 85,
        advancedFeatures: 60,
        polish: 30
      },
      issues: [],
      achievements: []
    };

    const trackingPath = path.join(this.projectRoot, '.project-management', 'tracking.json');
    fs.writeFileSync(trackingPath, JSON.stringify(tracking, null, 2));
    
    console.log('  ✅ Project tracking setup completed');
    return tracking;
  }

  /**
   * Generate project status report
   */
  async generateStatusReport() {
    console.log('📊 Generating project status report...');
    
    const analysisPath = path.join(this.projectRoot, '.project-management', 'analysis.json');
    const planPath = path.join(this.projectRoot, '.project-management', 'project-plan.json');
    const trackingPath = path.join(this.projectRoot, '.project-management', 'tracking.json');
    
    const analysis = fs.existsSync(analysisPath) ? JSON.parse(fs.readFileSync(analysisPath, 'utf8')) : {};
    const plan = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath, 'utf8')) : {};
    const tracking = fs.existsSync(trackingPath) ? JSON.parse(fs.readFileSync(trackingPath, 'utf8')) : {};

    const report = {
      timestamp: new Date().toISOString(),
      project: this.projectData,
      analysis,
      plan,
      tracking,
      summary: {
        totalFiles: analysis.codebase?.total?.files || 0,
        totalLines: analysis.codebase?.total?.lines || 0,
        totalDependencies: analysis.dependencies?.total || 0,
        testFiles: analysis.tests?.total?.files || 0,
        documentationScore: analysis.documentation?.total || 0,
        buildScore: analysis.build?.total || 0,
        deploymentScore: analysis.deployment?.total || 0
      }
    };

    const reportPath = path.join(this.projectRoot, '.project-management', 'reports', 'status-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`  ✅ Status report generated: ${reportPath}`);
    return report;
  }

  /**
   * Create task from template
   */
  async createTask(template, customData = {}) {
    const taskTemplates = {
      feature: {
        type: 'feature',
        title: 'New Feature',
        description: 'Implement new feature functionality',
        priority: 'medium',
        estimatedHours: 8,
        dependencies: [],
        acceptanceCriteria: [
          'Feature works as specified',
          'Tests are written and passing',
          'Documentation is updated'
        ]
      },
      bugfix: {
        type: 'bugfix',
        title: 'Bug Fix',
        description: 'Fix identified bug',
        priority: 'high',
        estimatedHours: 4,
        dependencies: [],
        acceptanceCriteria: [
          'Bug is fixed',
          'Regression tests are added',
          'Root cause is documented'
        ]
      },
      refactor: {
        type: 'refactor',
        title: 'Code Refactoring',
        description: 'Improve code structure and maintainability',
        priority: 'low',
        estimatedHours: 6,
        dependencies: [],
        acceptanceCriteria: [
          'Code is more maintainable',
          'Performance is maintained or improved',
          'Tests still pass'
        ]
      }
    };

    const templateData = taskTemplates[template] || taskTemplates.feature;
    const task = { ...templateData, ...customData, id: Date.now().toString() };

    const taskPath = path.join(this.projectRoot, '.project-management', 'tasks', `${task.id}.json`);
    fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
    
    console.log(`  ✅ Task created: ${task.title} (${task.id})`);
    return task;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0] || 'initialize';
  
  const pm = new ProjectManagementSuite();
  
  switch (command) {
    case 'init':
    case 'initialize':
      pm.initialize().catch(console.error);
      break;
    case 'analyze':
      pm.analyzeProject().catch(console.error);
      break;
    case 'plan':
      pm.generateProjectPlan().catch(console.error);
      break;
    case 'report':
      pm.generateStatusReport().catch(console.error);
      break;
    case 'task':
      const template = args[1] || 'feature';
      const customData = args[2] ? JSON.parse(args[2]) : {};
      pm.createTask(template, customData).catch(console.error);
      break;
    default:
      console.log('Available commands: init, analyze, plan, report, task');
  }
}

export default ProjectManagementSuite;
