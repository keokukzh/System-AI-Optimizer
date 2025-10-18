import { invoke } from '@tauri-apps/api/tauri'

/**
 * Tauri API utility functions
 * Replaces fetch calls with Tauri invoke calls
 */

export const tauriApi = {
  // System metrics
  async getMetrics() {
    try {
      return await invoke('get_metrics')
    } catch (error) {
      console.error('Failed to get metrics:', error)
      throw error
    }
  },

  // AI status
  async checkAiStatus() {
    try {
      return await invoke('check_ai_status')
    } catch (error) {
      console.error('Failed to check AI status:', error)
      return { available: false, status: 'offline' }
    }
  },

  // System info
  async getSystemInfo() {
    try {
      return await invoke('get_system_info')
    } catch (error) {
      console.error('Failed to get system info:', error)
      throw error
    }
  },

  // System profile
  async getSystemProfile() {
    try {
      return await invoke('get_system_profile')
    } catch (error) {
      console.error('Failed to get system profile:', error)
      throw error
    }
  },

  // Collect system info
  async collectSystemInfo() {
    try {
      return await invoke('collect_system_info')
    } catch (error) {
      console.error('Failed to collect system info:', error)
      throw error
    }
  },

  // LLM info
  async getLlmInfo() {
    try {
      return await invoke('get_llm_info')
    } catch (error) {
      console.error('Failed to get LLM info:', error)
      throw error
    }
  },

  // Initialize LLM
  async initLlm() {
    try {
      return await invoke('init_llm')
    } catch (error) {
      console.error('Failed to initialize LLM:', error)
      throw error
    }
  },

  // Scan directory
  async scanDirectory(path) {
    try {
      return await invoke('scan_directory', { path })
    } catch (error) {
      console.error('Failed to scan directory:', error)
      throw error
    }
  },

  // Get scan result
  async getScanResult(scanId) {
    try {
      return await invoke('get_scan_result', { scanId })
    } catch (error) {
      console.error('Failed to get scan result:', error)
      throw error
    }
  },

  // List scan results
  async listScanResults() {
    try {
      return await invoke('list_scan_results')
    } catch (error) {
      console.error('Failed to list scan results:', error)
      throw error
    }
  },

  // Generate AI suggestions
  async generateAiSuggestions(scanId) {
    try {
      return await invoke('generate_ai_suggestions', { scanId })
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
      throw error
    }
  },

  // Generate optimization suggestions
  async generateOptimizationSuggestions(scanId) {
    try {
      return await invoke('generate_optimization_suggestions', { scanId })
    } catch (error) {
      console.error('Failed to generate optimization suggestions:', error)
      throw error
    }
  },

  // Execute optimization
  async executeOptimization(actionType, target) {
    try {
      return await invoke('execute_optimization', { actionType, target })
    } catch (error) {
      console.error('Failed to execute optimization:', error)
      throw error
    }
  },

  // Get processes
  async getProcesses() {
    try {
      return await invoke('get_processes')
    } catch (error) {
      console.error('Failed to get processes:', error)
      throw error
    }
  },

  // Kill process
  async killProcess(pid) {
    try {
      return await invoke('kill_process', { pid })
    } catch (error) {
      console.error('Failed to kill process:', error)
      throw error
    }
  },

  // Get startup programs
  async getStartupPrograms() {
    try {
      return await invoke('get_startup_programs')
    } catch (error) {
      console.error('Failed to get startup programs:', error)
      throw error
    }
  },

  // Toggle startup program
  async toggleStartupProgram(name, enabled) {
    try {
      return await invoke('toggle_startup_program', { name, enabled })
    } catch (error) {
      console.error('Failed to toggle startup program:', error)
      throw error
    }
  },

  // Save settings
  async saveSettings(settings) {
    try {
      return await invoke('save_settings', { settings })
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw error
    }
  },

  // Load settings
  async loadSettings() {
    try {
      return await invoke('load_settings')
    } catch (error) {
      console.error('Failed to load settings:', error)
      throw error
    }
  },

  // Analyze system metrics
  async analyzeSystemMetrics() {
    try {
      return await invoke('analyze_system_metrics')
    } catch (error) {
      console.error('Failed to analyze system metrics:', error)
      throw error
    }
  }
}

export default tauriApi
