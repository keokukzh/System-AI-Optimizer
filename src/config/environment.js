/**
 * Environment Configuration
 * Centralized configuration for all environment variables and API endpoints
 */

// Default configuration
const defaultConfig = {
  // API Configuration
  API_BASE_URL: 'http://127.0.0.1:5174',
  API_TIMEOUT: 30000,
  
  // Development Configuration
  DEV_MODE: true,
  DEBUG_LOGGING: false,
  
  // AI/LLM Configuration
  LLM_SERVER_URL: 'http://127.0.0.1:11434',
  LLM_MODEL: 'phi3-mini-dev',
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

// API Endpoints
export const API_ENDPOINTS = {
  // System
  SYSTEM_INFO: `${config.API_BASE_URL}/api/system/info`,
  METRICS: `${config.API_BASE_URL}/api/metrics`,
  
  // Scanning
  SCAN: `${config.API_BASE_URL}/api/scan`,
  SCAN_STATUS: (scanId) => `${config.API_BASE_URL}/api/scan/${scanId}/status`,
  
  // AI & Optimization
  OPTIMIZE: `${config.API_BASE_URL}/api/optimize`,
  AI_STATUS: `${config.API_BASE_URL}/api/ai/status`,
  AI_TOOLS_SUGGEST: `${config.API_BASE_URL}/api/ai/tools/suggest`,
  
  // Actions
  ACTION: `${config.API_BASE_URL}/api/action`,
  ACTIONS_HISTORY: `${config.API_BASE_URL}/api/actions/history`,
  ACTIONS_UNDOABLE: `${config.API_BASE_URL}/api/actions/undoable`,
  UNDO: `${config.API_BASE_URL}/api/undo`,
  
  // Policy
  POLICY_VALIDATE: `${config.API_BASE_URL}/api/policy/validate`,
  
  // Vault
  VAULT_STATUS: `${config.API_BASE_URL}/api/vault/status`,
  VAULT_LIST: `${config.API_BASE_URL}/api/vault/list`,
  VAULT_UNLOCK: `${config.API_BASE_URL}/api/vault/unlock`,
  VAULT_LOCK: `${config.API_BASE_URL}/api/vault/lock`,
  VAULT_SET: `${config.API_BASE_URL}/api/vault/set`,
  VAULT_GET: `${config.API_BASE_URL}/api/vault/get`,
  VAULT_REMOVE: `${config.API_BASE_URL}/api/vault/remove`,
  
  // Process Management
  PROCESS_LIST: `${config.API_BASE_URL}/api/process/list`,
  PROCESS_STATS: `${config.API_BASE_URL}/api/process/stats`,
  PROCESS_TERMINATE: `${config.API_BASE_URL}/api/process/terminate`,
  PROCESS_PRIORITY: `${config.API_BASE_URL}/api/process/priority`,
  
  // Startup Management
  STARTUP_STATUS: `${config.API_BASE_URL}/api/startup/status`,
  STARTUP_LIST: `${config.API_BASE_URL}/api/startup/list`,
  STARTUP_ENABLE: `${config.API_BASE_URL}/api/startup/enable`,
  STARTUP_DISABLE: `${config.API_BASE_URL}/api/startup/disable`,
  STARTUP_REMOVE: `${config.API_BASE_URL}/api/startup/remove`,
  STARTUP_RESTORE: `${config.API_BASE_URL}/api/startup/restore`,
  
  // Installer
  INSTALLER_APPS: `${config.API_BASE_URL}/api/installer/apps`,
  INSTALLER_GITHUB: `${config.API_BASE_URL}/api/installer/github`,
  INSTALLER_LAUNCH: `${config.API_BASE_URL}/api/installer/launch`,
  INSTALLER_APP: (appId) => `${config.API_BASE_URL}/api/installer/app/${appId}`,
  
  // License
  LICENSE_STATUS: `${config.API_BASE_URL}/api/license/status`,
  LICENSE_INFO: `${config.API_BASE_URL}/api/license/info`,
  LICENSE_ACTIVATE: `${config.API_BASE_URL}/api/license/activate`,
  LICENSE_DEACTIVATE: `${config.API_BASE_URL}/api/license/deactivate`
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
