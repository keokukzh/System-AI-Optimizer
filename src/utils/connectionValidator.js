/**
 * Connection Validator
 * Validates backend connection on startup and provides detailed diagnostics
 */

import { API_CONFIG } from '../config/environment'

class ConnectionValidator {
  constructor() {
    this.results = {
      backend: null,
      endpoints: {},
      performance: {},
      errors: []
    }
    this.startTime = Date.now()
  }

  /**
   * Test a single endpoint
   */
  async testEndpoint(endpoint, options = {}) {
    const { timeout = 3000, method = 'GET', body = null } = options
    const url = `${API_CONFIG.BASE_URL}${endpoint}`
    
    try {
      const startTime = performance.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const requestOptions = {
        method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      }
      
      if (body) {
        requestOptions.body = JSON.stringify(body)
      }
      
      const response = await fetch(url, requestOptions)
      clearTimeout(timeoutId)
      
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)
      
      let responseData = null
      try {
        responseData = await response.json()
      } catch {
        responseData = { text: await response.text() }
      }
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        data: responseData,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        status: 0,
        statusText: 'Network Error',
        responseTime: 0,
        data: null,
        error: error.message
      }
    }
  }

  /**
   * Test all critical endpoints
   */
  async testAllEndpoints() {
    const endpoints = [
      { path: '/health', name: 'Health Check', critical: true },
      { path: '/api/metrics', name: 'System Metrics', critical: true },
      { path: '/api/ai/status', name: 'AI Status', critical: false },
      { path: '/api/system/info', name: 'System Info', critical: false },
      { path: '/api/processes', name: 'Process List', critical: false },
      { path: '/api/startup', name: 'Startup Programs', critical: false }
    ]

    console.log('🔍 Testing API endpoints...')
    
    for (const endpoint of endpoints) {
      console.log(`  Testing ${endpoint.name} (${endpoint.path})`)
      const result = await this.testEndpoint(endpoint.path)
      
      this.results.endpoints[endpoint.path] = {
        ...result,
        name: endpoint.name,
        critical: endpoint.critical
      }
      
      if (result.success) {
        console.log(`  ✅ ${endpoint.name}: ${result.responseTime}ms`)
      } else {
        console.log(`  ❌ ${endpoint.name}: ${result.error || result.statusText}`)
        if (endpoint.critical) {
          this.results.errors.push(`Critical endpoint ${endpoint.name} failed: ${result.error || result.statusText}`)
        }
      }
    }
  }

  /**
   * Test backend connection with retry logic
   */
  async testBackendConnection(retries = 3) {
    console.log('🔗 Testing backend connection...')
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`  Attempt ${attempt}/${retries}`)
      
      try {
        const result = await this.testEndpoint('/health', { timeout: 2000 })
        
        if (result.success) {
          this.results.backend = {
            connected: true,
            responseTime: result.responseTime,
            attempt,
            url: API_CONFIG.BASE_URL
          }
          console.log(`  ✅ Backend connected in ${result.responseTime}ms`)
          return true
        } else {
          console.log(`  ❌ Backend health check failed: ${result.error || result.statusText}`)
        }
      } catch (error) {
        console.log(`  ❌ Backend connection failed: ${error.message}`)
      }
      
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        console.log(`  ⏳ Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    this.results.backend = {
      connected: false,
      responseTime: 0,
      attempt: retries,
      url: API_CONFIG.BASE_URL,
      error: 'All connection attempts failed'
    }
    this.results.errors.push('Backend connection failed after all retries')
    return false
  }

  /**
   * Test port conflict detection
   */
  async testPortDetection() {
    console.log('🔍 Testing port detection...')
    
    try {
      const { detectPortConflict } = await import('../config/environment')
      const detectedPort = await detectPortConflict()
      
      this.results.portDetection = {
        success: true,
        detectedPort,
        configuredPort: API_CONFIG.BACKEND_PORT
      }
      
      console.log(`  ✅ Port detection successful: ${detectedPort}`)
      return true
    } catch (error) {
      this.results.portDetection = {
        success: false,
        error: error.message
      }
      this.results.errors.push(`Port detection failed: ${error.message}`)
      console.log(`  ❌ Port detection failed: ${error.message}`)
      return false
    }
  }

  /**
   * Run complete validation
   */
  async validate() {
    console.log('🚀 Starting connection validation...')
    console.log(`📍 Backend URL: ${API_CONFIG.BASE_URL}`)
    
    // Test port detection first
    await this.testPortDetection()
    
    // Test backend connection
    const backendConnected = await this.testBackendConnection()
    
    if (backendConnected) {
      // Test all endpoints
      await this.testAllEndpoints()
    }
    
    // Calculate performance metrics
    this.results.performance = {
      totalTime: Date.now() - this.startTime,
      endpointCount: Object.keys(this.results.endpoints).length,
      successCount: Object.values(this.results.endpoints).filter(e => e.success).length,
      criticalFailures: this.results.errors.filter(e => e.includes('Critical')).length
    }
    
    console.log('📊 Validation complete:', this.results)
    return this.results
  }

  /**
   * Get validation summary
   */
  getSummary() {
    const { backend, endpoints, performance, errors } = this.results
    
    return {
      status: backend?.connected ? 'connected' : 'disconnected',
      backend: backend?.connected ? {
        url: backend.url,
        responseTime: backend.responseTime
      } : null,
      endpoints: {
        total: performance.endpointCount,
        successful: performance.successCount,
        failed: performance.endpointCount - performance.successCount
      },
      performance: {
        totalTime: performance.totalTime,
        criticalFailures: performance.criticalFailures
      },
      errors: errors.length > 0 ? errors : null
    }
  }

  /**
   * Clear browser cache and localStorage
   */
  clearCache() {
    try {
      // Clear localStorage
      localStorage.clear()
      console.log('✅ localStorage cleared')
      
      // Clear sessionStorage
      sessionStorage.clear()
      console.log('✅ sessionStorage cleared')
      
      // Clear service worker cache if available
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name)
          })
        })
        console.log('✅ Service worker caches cleared')
      }
      
      return true
    } catch (error) {
      console.error('❌ Failed to clear cache:', error)
      return false
    }
  }
}

// Create singleton instance
const connectionValidator = new ConnectionValidator()

export default connectionValidator
export { ConnectionValidator }
