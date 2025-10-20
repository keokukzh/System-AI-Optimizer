/**
 * Environment Configuration
 * Centralized configuration for all environment variables and API endpoints
 */

// Detect if running in Tauri
const isTauri = typeof window !== 'undefined' && window.__TAURI__

// Centralized API configuration
export const API_CONFIG = {
  BACKEND_PORT: 5175,  // Standardized to 5175
  BACKEND_HOST: '127.0.0.1',
  get BASE_URL() {
    // Always use 127.0.0.1:5175 for backend
    return `http://127.0.0.1:5175`
  },
  TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
  IS_TAURI: isTauri
}

// Port conflict detection and auto-fallback
export const detectPortConflict = async () => {
  const testPort = async (port) => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  // Test primary port first
  if (await testPort(API_CONFIG.BACKEND_PORT)) {
    return API_CONFIG.BACKEND_PORT
  }
  
  // Try fallback ports
  const fallbackPorts = [5176, 5177, 5178, 5179]
  for (const port of fallbackPorts) {
    if (await testPort(port)) {
      console.warn(`Backend found on fallback port ${port}`)
      API_CONFIG.BACKEND_PORT = port
      return port
    }
  }
  
  throw new Error('Backend not found on any port')
}

// Default configuration
const defaultConfig = {
  // API Configuration
  API_BASE_URL: API_CONFIG.BASE_URL,
  API_TIMEOUT: 30000,
  
  // Development Configuration
  DEV_MODE: true,
  DEBUG_LOGGING: false,
  
  // AI/LLM Configuration
  LLM_SERVER_URL: 'http://127.0.0.1:11434',
  LLM_MODEL: 'qwen2.5-coder:latest',
  LLM_TIMEOUT: 60000,
  
  // Security Configuration
  ENABLE_VAULT: true,
  VAULT_TIMEOUT: 30000,
  
  // Feature Flags
  ENABLE_AUTOMATION: true,
  ENABLE_PROCESS_MANAGEMENT: true,
  ENABLE_STARTUP_MANAGEMENT: true,
  ENABLE_AI_SUGGESTIONS: true,
  
  // External Services
  GITHUB_API_URL: 'https://api.github.com',
  OPTIAI_WEBSITE_URL: 'https://optiai.com',
  
  // Build Configuration
  APP_VERSION: '1.0.0',
  BUILD_TIMESTAMP: new Date().toISOString()
}

// Load environment variables with fallbacks
const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || defaultConfig.API_BASE_URL,
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || defaultConfig.API_TIMEOUT,
  
  // Development Configuration
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true' || defaultConfig.DEV_MODE,
  DEBUG_LOGGING: import.meta.env.VITE_DEBUG_LOGGING === 'true' || defaultConfig.DEBUG_LOGGING,
  
  // AI/LLM Configuration
  LLM_SERVER_URL: import.meta.env.VITE_LLM_SERVER_URL || defaultConfig.LLM_SERVER_URL,
  LLM_MODEL: import.meta.env.VITE_LLM_MODEL || defaultConfig.LLM_MODEL,
  LLM_TIMEOUT: parseInt(import.meta.env.VITE_LLM_TIMEOUT) || defaultConfig.LLM_TIMEOUT,
  
  // Security Configuration
  ENABLE_VAULT: import.meta.env.VITE_ENABLE_VAULT === 'true' || defaultConfig.ENABLE_VAULT,
  VAULT_TIMEOUT: parseInt(import.meta.env.VITE_VAULT_TIMEOUT) || defaultConfig.VAULT_TIMEOUT,
  
  // Feature Flags
  ENABLE_AUTOMATION: import.meta.env.VITE_ENABLE_AUTOMATION === 'true' || defaultConfig.ENABLE_AUTOMATION,
  ENABLE_PROCESS_MANAGEMENT: import.meta.env.VITE_ENABLE_PROCESS_MANAGEMENT === 'true' || defaultConfig.ENABLE_PROCESS_MANAGEMENT,
  ENABLE_STARTUP_MANAGEMENT: import.meta.env.VITE_ENABLE_STARTUP_MANAGEMENT === 'true' || defaultConfig.ENABLE_STARTUP_MANAGEMENT,
  ENABLE_AI_SUGGESTIONS: import.meta.env.VITE_ENABLE_AI_SUGGESTIONS === 'true' || defaultConfig.ENABLE_AI_SUGGESTIONS,
  
  // External Services
  GITHUB_API_URL: import.meta.env.VITE_GITHUB_API_URL || defaultConfig.GITHUB_API_URL,
  OPTIAI_WEBSITE_URL: import.meta.env.VITE_OPTIAI_WEBSITE_URL || defaultConfig.OPTIAI_WEBSITE_URL,
  
  // Build Configuration
  APP_VERSION: import.meta.env.VITE_APP_VERSION || defaultConfig.APP_VERSION,
  BUILD_TIMESTAMP: import.meta.env.VITE_BUILD_TIMESTAMP || defaultConfig.BUILD_TIMESTAMP
}

// API Endpoints - Use API_CONFIG.BASE_URL for dynamic Tauri detection
export const API_ENDPOINTS = {
  // System
  SYSTEM_INFO: `${API_CONFIG.BASE_URL}/api/system/info`,
  METRICS: `${API_CONFIG.BASE_URL}/api/metrics`,
  
  // Scanning
  SCAN: `${API_CONFIG.BASE_URL}/api/scan`,
  SCAN_STATUS: (scanId) => `${API_CONFIG.BASE_URL}/api/scan/${scanId}/status`,
  
  // AI & Optimization
  OPTIMIZE: `${API_CONFIG.BASE_URL}/api/optimize`,
  AI_STATUS: `${API_CONFIG.BASE_URL}/api/ai/status`,
  AI_TOOLS_SUGGEST: `${API_CONFIG.BASE_URL}/api/ai/tools/suggest`,
  
  // Actions
  ACTION: `${API_CONFIG.BASE_URL}/api/action`,
  ACTIONS_HISTORY: `${API_CONFIG.BASE_URL}/api/actions/history`,
  ACTIONS_UNDOABLE: `${API_CONFIG.BASE_URL}/api/actions/undoable`,
  UNDO: `${API_CONFIG.BASE_URL}/api/undo`,
  
  // Policy
  POLICY_VALIDATE: `${API_CONFIG.BASE_URL}/api/policy/validate`,
  
  // Vault
  VAULT_STATUS: `${API_CONFIG.BASE_URL}/api/vault/status`,
  VAULT_LIST: `${API_CONFIG.BASE_URL}/api/vault/list`,
  VAULT_UNLOCK: `${API_CONFIG.BASE_URL}/api/vault/unlock`,
  VAULT_LOCK: `${API_CONFIG.BASE_URL}/api/vault/lock`,
  VAULT_SET: `${API_CONFIG.BASE_URL}/api/vault/set`,
  VAULT_GET: `${API_CONFIG.BASE_URL}/api/vault/get`,
  VAULT_REMOVE: `${API_CONFIG.BASE_URL}/api/vault/remove`,
  
  // Process Management
  PROCESS_LIST: `${API_CONFIG.BASE_URL}/api/process/list`,
  PROCESS_STATS: `${API_CONFIG.BASE_URL}/api/process/stats`,
  PROCESS_TERMINATE: `${API_CONFIG.BASE_URL}/api/process/terminate`,
  PROCESS_PRIORITY: `${API_CONFIG.BASE_URL}/api/process/priority`,
  
  // Startup Management
  STARTUP_STATUS: `${API_CONFIG.BASE_URL}/api/startup/status`,
  STARTUP_LIST: `${API_CONFIG.BASE_URL}/api/startup/list`,
  STARTUP_ENABLE: `${API_CONFIG.BASE_URL}/api/startup/enable`,
  STARTUP_DISABLE: `${API_CONFIG.BASE_URL}/api/startup/disable`,
  STARTUP_REMOVE: `${API_CONFIG.BASE_URL}/api/startup/remove`,
  STARTUP_RESTORE: `${API_CONFIG.BASE_URL}/api/startup/restore`,
  
  // Installer
  INSTALLER_APPS: `${API_CONFIG.BASE_URL}/api/installer/apps`,
  INSTALLER_GITHUB: `${API_CONFIG.BASE_URL}/api/installer/github`,
  INSTALLER_LAUNCH: `${API_CONFIG.BASE_URL}/api/installer/launch`,
  INSTALLER_APP: (appId) => `${API_CONFIG.BASE_URL}/api/installer/app/${appId}`,
  
  // License
  LICENSE_STATUS: `${API_CONFIG.BASE_URL}/api/license/status`,
  LICENSE_INFO: `${API_CONFIG.BASE_URL}/api/license/info`,
  LICENSE_ACTIVATE: `${API_CONFIG.BASE_URL}/api/license/activate`,
  LICENSE_DEACTIVATE: `${API_CONFIG.BASE_URL}/api/license/deactivate`
}

// Export configuration
export default config

// Export individual values for convenience
export const {
  API_BASE_URL,
  API_TIMEOUT,
  DEV_MODE,
  DEBUG_LOGGING,
  LLM_SERVER_URL,
  LLM_MODEL,
  LLM_TIMEOUT,
  ENABLE_VAULT,
  VAULT_TIMEOUT,
  ENABLE_AUTOMATION,
  ENABLE_PROCESS_MANAGEMENT,
  ENABLE_STARTUP_MANAGEMENT,
  ENABLE_AI_SUGGESTIONS,
  GITHUB_API_URL,
  OPTIAI_WEBSITE_URL,
  APP_VERSION,
  BUILD_TIMESTAMP
} = config
