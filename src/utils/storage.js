/**
 * Storage Utility - localStorage wrapper with encryption for sensitive data
 * Provides type-safe getters/setters and automatic JSON serialization
 */

/**
 * Simple encryption/decryption for sensitive data
 * Note: This is basic obfuscation, not cryptographically secure
 * For production, use proper encryption libraries
 */
class SimpleEncryption {
  constructor(key = 'optiai-secret-key') {
    this.key = key
  }

  encrypt(text) {
    try {
      let result = ''
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
        result += String.fromCharCode(charCode)
      }
      return btoa(result)
    } catch (error) {
      console.error('Encryption failed:', error)
      return text
    }
  }

  decrypt(encryptedText) {
    try {
      const text = atob(encryptedText)
      let result = ''
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
        result += String.fromCharCode(charCode)
      }
      return result
    } catch (error) {
      console.error('Decryption failed:', error)
      return encryptedText
    }
  }
}

const encryption = new SimpleEncryption()

/**
 * Storage class with type-safe operations
 */
class Storage {
  constructor(prefix = 'optiai-') {
    this.prefix = prefix
  }

  /**
   * Get full key with prefix
   * @param {string} key - Storage key
   * @returns {string} - Prefixed key
   */
  getKey(key) {
    return `${this.prefix}${key}`
  }

  /**
   * Set a value in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {Object} options - Storage options
   */
  set(key, value, options = {}) {
    const { encrypt = false, ttl = null } = options
    
    try {
      let serializedValue = JSON.stringify(value)
      
      // Encrypt if requested
      if (encrypt) {
        serializedValue = encryption.encrypt(serializedValue)
      }
      
      // Add metadata
      const storageData = {
        value: serializedValue,
        encrypted: encrypt,
        timestamp: Date.now(),
        ttl: ttl
      }
      
      localStorage.setItem(this.getKey(key), JSON.stringify(storageData))
    } catch (error) {
      console.error(`Failed to store ${key}:`, error)
    }
  }

  /**
   * Get a value from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} - Stored value or default
   */
  get(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(this.getKey(key))
      if (!stored) return defaultValue
      
      const storageData = JSON.parse(stored)
      
      // Check TTL
      if (storageData.ttl && Date.now() - storageData.timestamp > storageData.ttl) {
        this.remove(key)
        return defaultValue
      }
      
      let value = storageData.value
      
      // Decrypt if needed
      if (storageData.encrypted) {
        value = encryption.decrypt(value)
      }
      
      return JSON.parse(value)
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error)
      return defaultValue
    }
  }

  /**
   * Remove a key from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    localStorage.removeItem(this.getKey(key))
  }

  /**
   * Check if a key exists
   * @param {string} key - Storage key
   * @returns {boolean} - True if key exists
   */
  has(key) {
    return localStorage.getItem(this.getKey(key)) !== null
  }

  /**
   * Clear all keys with this prefix
   */
  clear() {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Get all keys with this prefix
   * @returns {Array} - Array of keys
   */
  keys() {
    const keys = Object.keys(localStorage)
    return keys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.substring(this.prefix.length))
  }

  /**
   * Get storage statistics
   * @returns {Object} - Storage stats
   */
  getStats() {
    const keys = this.keys()
    let totalSize = 0
    let expiredCount = 0
    
    keys.forEach(key => {
      const stored = localStorage.getItem(this.getKey(key))
      if (stored) {
        totalSize += stored.length
        
        try {
          const storageData = JSON.parse(stored)
          if (storageData.ttl && Date.now() - storageData.timestamp > storageData.ttl) {
            expiredCount++
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    })
    
    return {
      totalKeys: keys.length,
      totalSize,
      expiredCount,
      sizeFormatted: this.formatBytes(totalSize)
    }
  }

  /**
   * Clean up expired entries
   * @returns {number} - Number of entries cleaned
   */
  cleanup() {
    const keys = this.keys()
    let cleanedCount = 0
    
    keys.forEach(key => {
      const stored = localStorage.getItem(this.getKey(key))
      if (stored) {
        try {
          const storageData = JSON.parse(stored)
          if (storageData.ttl && Date.now() - storageData.timestamp > storageData.ttl) {
            this.remove(key)
            cleanedCount++
          }
        } catch (error) {
          // Remove corrupted entries
          this.remove(key)
          cleanedCount++
        }
      }
    })
    
    return cleanedCount
  }

  /**
   * Format bytes to human readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} - Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Create default storage instance
const storage = new Storage()

/**
 * Type-safe storage helpers for common data types
 */
export const storageHelpers = {
  /**
   * Store user preferences
   * @param {Object} preferences - User preferences
   */
  setPreferences(preferences) {
    storage.set('preferences', preferences, { ttl: null }) // Never expire
  },

  /**
   * Get user preferences
   * @returns {Object} - User preferences
   */
  getPreferences() {
    return storage.get('preferences', {
      theme: 'dark',
      sidebarCollapsed: false,
      pollingInterval: 10000,
      notifications: {
        enabled: true,
        sound: true,
        desktop: false
      },
      defaultScanPaths: ['C:\\'],
      autoRefresh: true
    })
  },

  /**
   * Store scan history
   * @param {Array} history - Scan history
   */
  setScanHistory(history) {
    storage.set('scan-history', history, { ttl: 30 * 24 * 60 * 60 * 1000 }) // 30 days
  },

  /**
   * Get scan history
   * @returns {Array} - Scan history
   */
  getScanHistory() {
    return storage.get('scan-history', [])
  },

  /**
   * Store action history
   * @param {Array} history - Action history
   */
  setActionHistory(history) {
    storage.set('action-history', history, { ttl: 90 * 24 * 60 * 60 * 1000 }) // 90 days
  },

  /**
   * Get action history
   * @returns {Array} - Action history
   */
  getActionHistory() {
    return storage.get('action-history', [])
  },

  /**
   * Store notifications
   * @param {Array} notifications - Notifications
   */
  setNotifications(notifications) {
    storage.set('notifications', notifications, { ttl: 7 * 24 * 60 * 60 * 1000 }) // 7 days
  },

  /**
   * Get notifications
   * @returns {Array} - Notifications
   */
  getNotifications() {
    return storage.get('notifications', [])
  },

  /**
   * Store sensitive data (encrypted)
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  setSensitive(key, value) {
    storage.set(key, value, { encrypt: true, ttl: null })
  },

  /**
   * Get sensitive data (decrypted)
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value
   * @returns {any} - Decrypted value
   */
  getSensitive(key, defaultValue = null) {
    return storage.get(key, defaultValue)
  },

  /**
   * Store temporary data with TTL
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} ttl - Time to live in milliseconds
   */
  setTemporary(key, value, ttl) {
    storage.set(key, value, { ttl })
  },

  /**
   * Get temporary data
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value
   * @returns {any} - Stored value or default
   */
  getTemporary(key, defaultValue = null) {
    return storage.get(key, defaultValue)
  }
}

/**
 * Cross-tab synchronization
 */
class CrossTabSync {
  constructor() {
    this.listeners = new Map()
    this.setupStorageListener()
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('optiai-')) {
        const key = e.key.substring(7) // Remove 'optiai-' prefix
        
        if (this.listeners.has(key)) {
          const listeners = this.listeners.get(key)
          listeners.forEach(listener => {
            try {
              listener(e.newValue ? JSON.parse(e.newValue) : null, e.oldValue ? JSON.parse(e.oldValue) : null)
            } catch (error) {
              console.error('Cross-tab sync error:', error)
            }
          })
        }
      }
    })
  }

  /**
   * Listen for changes to a specific key across tabs
   * @param {string} key - Storage key
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    
    this.listeners.get(key).add(callback)
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }
}

// Create cross-tab sync instance
const crossTabSync = new CrossTabSync()

// Auto-cleanup expired entries every hour
setInterval(() => {
  const cleaned = storage.cleanup()
  if (cleaned > 0) {
    // Storage cleanup: removed ${cleaned} expired entries
  }
}, 60 * 60 * 1000)

export default storage
export { crossTabSync }
