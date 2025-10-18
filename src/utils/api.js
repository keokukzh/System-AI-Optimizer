/**
 * API Utility
 * Tauri-based API client replacing fetch calls with invoke
 */

import { invoke } from '@tauri-apps/api/tauri';

// Tauri API wrapper functions
export async function getMetrics() {
  return await invoke('get_metrics');
}

export async function scanDirectory(path) {
  return await invoke('scan_directory', { path });
}

export async function getScanResult(scanId) {
  return await invoke('get_scan_result', { scanId });
}

export async function listScanResults() {
  return await invoke('list_scan_results');
}

export async function generateAISuggestions(scanId) {
  return await invoke('generate_ai_suggestions', { scanId });
}

export async function generateOptimizationSuggestions(scanId) {
  return await invoke('generate_optimization_suggestions', { scanId });
}

export async function executeOptimization(actionType, target) {
  return await invoke('execute_optimization', { actionType, target });
}

export async function getProcesses() {
  return await invoke('get_processes');
}

export async function killProcess(pid) {
  return await invoke('kill_process', { pid });
}

export async function getStartupPrograms() {
  return await invoke('get_startup_programs');
}

export async function toggleStartupProgram(name, enabled) {
  return await invoke('toggle_startup_program', { name, enabled });
}

export async function saveSettings(settings) {
  return await invoke('save_settings', { settings });
}

export async function loadSettings() {
  return await invoke('load_settings');
}

export async function initLLM() {
  return await invoke('init_llm');
}

export async function getLLMInfo() {
  return await invoke('get_llm_info');
}

export async function analyzeSystemMetrics() {
  return await invoke('analyze_system_metrics');
}

export async function getSystemProfile() {
  return await invoke('get_system_profile');
}

export async function collectSystemInfo() {
  return await invoke('collect_system_info');
}

export async function getSystemInfo() {
  return await invoke('get_system_info');
}

/**
 * Legacy API compatibility wrapper
 * Maps old API endpoints to new Tauri commands
 */
export const api = {
  // System
  getSystemInfo: () => getSystemInfo(),
  getMetrics: () => getMetrics(),
  
  // Scanning
  startScan: (data) => scanDirectory(data.path || 'C:\\'),
  getScanStatus: (scanId) => getScanResult(scanId),
  
  // AI & Optimization
  optimize: (data) => generateOptimizationSuggestions(data.scanId),
  getAIStatus: () => getLLMInfo(),
  suggestTools: (data) => generateAISuggestions(data.scanId),
  
  // Actions
  executeAction: (data) => executeOptimization(data.action, data.target),
  getActionsHistory: () => Promise.resolve([]), // TODO: Implement
  getUndoableActions: () => Promise.resolve([]), // TODO: Implement
  undoAction: (data) => Promise.resolve({ success: true }), // TODO: Implement
  
  // Process Management
  getProcessList: () => getProcesses(),
  getProcessStats: () => getMetrics(),
  terminateProcess: (data) => killProcess(data.pid),
  setProcessPriority: (data) => Promise.resolve({ success: true }), // TODO: Implement
  
  // Startup Management
  getStartupStatus: () => Promise.resolve({ status: 'ready' }),
  getStartupList: () => getStartupPrograms(),
  enableStartupItem: (data) => toggleStartupProgram(data.name, true),
  disableStartupItem: (data) => toggleStartupProgram(data.name, false),
  removeStartupItem: (data) => Promise.resolve({ success: true }), // TODO: Implement
  restoreStartupItem: (data) => Promise.resolve({ success: true }), // TODO: Implement
  
  // Installer
  getInstalledApps: () => Promise.resolve([]), // TODO: Implement
  installFromGitHub: (data) => Promise.resolve({ success: true }), // TODO: Implement
  launchApp: (data) => Promise.resolve({ success: true }), // TODO: Implement
  uninstallApp: (appId) => Promise.resolve({ success: true }), // TODO: Implement
  
  // License
  getLicenseStatus: () => Promise.resolve({ status: 'active' }),
  getLicenseInfo: () => Promise.resolve({ type: 'free' }),
  activateLicense: (data) => Promise.resolve({ success: true }),
  deactivateLicense: () => Promise.resolve({ success: true })
}

// Legacy compatibility function
export async function callApi(endpoint, options = {}) {
  // Map old API endpoints to new Tauri commands
  switch (endpoint) {
    case '/api/metrics':
      return await getMetrics();
    case '/api/scan':
      const body = options.body ? JSON.parse(options.body) : {};
      return await scanDirectory(body.path || 'C:\\');
    case '/api/processes':
      return await getProcesses();
    case '/api/startup':
      return await getStartupPrograms();
    default:
      throw new Error(`Unknown API endpoint: ${endpoint}`);
  }
}

export default api
