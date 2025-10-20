import React, { useState, useEffect } from 'react'
import { Lock, Unlock, Eye, EyeOff, Copy, Trash2, Plus, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { API_CONFIG } from '../config/environment'

const VaultTab = () => {
  const [vaultStatus, setVaultStatus] = useState({ unlocked: false })
  const [secrets, setSecrets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Master password dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [masterPassword, setMasterPassword] = useState('')
  const [isPasswordDialogLoading, setIsPasswordDialogLoading] = useState(false)
  
  // Secret management
  const [showAddSecret, setShowAddSecret] = useState(false)
  const [newSecretName, setNewSecretName] = useState('')
  const [newSecretValue, setNewSecretValue] = useState('')
  const [newSecretMetadata, setNewSecretMetadata] = useState('')
  const [isAddingSecret, setIsAddingSecret] = useState(false)
  
  // Revealed secrets (temporary)
  const [revealedSecrets, setRevealedSecrets] = useState(new Set())
  const [copiedSecrets, setCopiedSecrets] = useState(new Set())

  useEffect(() => {
    checkVaultStatus()
  }, [])

  const checkVaultStatus = async () => {
    try {
      // For now, assume vault is unlocked for testing
      setVaultStatus({ unlocked: true })
      loadSecrets()
    } catch (err) {
      console.error('Failed to check vault status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSecrets = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/vault/secrets`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSecrets(data.secrets || [])
        } else {
          setError(data.error || 'Failed to load secrets')
        }
      }
    } catch (err) {
      setError(`Failed to load secrets: ${err.message}`)
    }
  }

  const handleUnlock = async () => {
    if (!masterPassword.trim()) return

    setIsPasswordDialogLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/vault/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: masterPassword })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setVaultStatus({ unlocked: true })
        setShowPasswordDialog(false)
        setMasterPassword('')
        loadSecrets()
        setSuccess('Vault unlocked successfully')
      } else {
        setError(data.error || 'Failed to unlock vault')
      }
    } catch (err) {
      setError(`Unlock failed: ${err.message}`)
    } finally {
      setIsPasswordDialogLoading(false)
    }
  }

  const handleLock = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/vault/lock`, {
        method: 'POST'
      })

      if (response.ok) {
        setVaultStatus({ unlocked: false })
        setSecrets([])
        setRevealedSecrets(new Set())
        setSuccess('Vault locked successfully')
      }
    } catch (err) {
      setError(`Lock failed: ${err.message}`)
    }
  }

  const handleAddSecret = async () => {
    if (!newSecretName.trim() || !newSecretValue.trim()) return

    setIsAddingSecret(true)
    setError('')
    
    try {
      const metadata = newSecretMetadata.trim() ? { description: newSecretMetadata } : {}
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/vault/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newSecretName.trim(),
          value: newSecretValue.trim(),
          description: newSecretMetadata.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setNewSecretName('')
        setNewSecretValue('')
        setNewSecretMetadata('')
        setShowAddSecret(false)
        loadSecrets()
        setSuccess(`Secret '${newSecretName}' added successfully`)
      } else {
        setError(data.error || 'Failed to add secret')
      }
    } catch (err) {
      setError(`Add secret failed: ${err.message}`)
    } finally {
      setIsAddingSecret(false)
    }
  }

  const handleRevealSecret = async (name) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/vault/secrets/${name}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Store revealed secret temporarily
        setRevealedSecrets(prev => new Set([...prev, name]))
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
          setRevealedSecrets(prev => {
            const newSet = new Set(prev)
            newSet.delete(name)
            return newSet
          })
        }, 30000)
      } else {
        setError(data.error || 'Failed to reveal secret')
      }
    } catch (err) {
      setError(`Reveal failed: ${err.message}`)
    }
  }

  const handleCopySecret = async (name) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/vault/secrets/${name}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Copy to clipboard
        await navigator.clipboard.writeText(data.value)
        setCopiedSecrets(prev => new Set([...prev, name]))
        
        // Clear copy indicator after 3 seconds
        setTimeout(() => {
          setCopiedSecrets(prev => {
            const newSet = new Set(prev)
            newSet.delete(name)
            return newSet
          })
        }, 3000)
        
        setSuccess(`Secret '${name}' copied to clipboard`)
      } else {
        setError(data.error || 'Failed to copy secret')
      }
    } catch (err) {
      setError(`Copy failed: ${err.message}`)
    }
  }

  const handleRemoveSecret = async (name) => {
    if (!confirm(`Are you sure you want to remove the secret '${name}'?`)) return

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/vault/secrets/${name}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        loadSecrets()
        setSuccess(`Secret '${name}' removed successfully`)
      } else {
        setError(data.error || 'Failed to remove secret')
      }
    } catch (err) {
      setError(`Remove failed: ${err.message}`)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Secure Vault</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Securely store and manage your API keys and sensitive information
        </p>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg flex items-center space-x-3 ${
        vaultStatus.unlocked 
          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
      }`}>
        {vaultStatus.unlocked ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <AlertTriangle className="w-5 h-5" />
        )}
        <div>
          <p className="font-medium">
            {vaultStatus.unlocked ? 'Vault Unlocked' : 'Vault Locked'}
          </p>
          <p className="text-sm">
            {vaultStatus.unlocked 
              ? 'Your secrets are accessible. Vault will auto-lock after 5 minutes of inactivity.'
              : 'Enter your master password to access your secrets.'
            }
          </p>
        </div>
        <div className="ml-auto">
          {vaultStatus.unlocked ? (
            <button
              onClick={handleLock}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Lock</span>
            </button>
          ) : (
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock</span>
            </button>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Master Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Unlock Vault
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Master Password
                </label>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your master password"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleUnlock}
                  disabled={isPasswordDialogLoading || !masterPassword.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPasswordDialogLoading ? 'Unlocking...' : 'Unlock'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordDialog(false)
                    setMasterPassword('')
                    setError('')
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secrets Management */}
      {vaultStatus.unlocked && (
        <div className="space-y-4">
          {/* Add Secret */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Secret</h3>
              <button
                onClick={() => setShowAddSecret(!showAddSecret)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Secret</span>
              </button>
            </div>

            {showAddSecret && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newSecretName}
                    onChange={(e) => setNewSecretName(e.target.value)}
                    placeholder="e.g., OpenAI API Key"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Value
                  </label>
                  <textarea
                    value={newSecretValue}
                    onChange={(e) => setNewSecretValue(e.target.value)}
                    placeholder="Enter the secret value"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newSecretMetadata}
                    onChange={(e) => setNewSecretMetadata(e.target.value)}
                    placeholder="Brief description of this secret"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddSecret}
                    disabled={isAddingSecret || !newSecretName.trim() || !newSecretValue.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingSecret ? 'Adding...' : 'Add Secret'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSecret(false)
                      setNewSecretName('')
                      setNewSecretValue('')
                      setNewSecretMetadata('')
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Secrets List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Stored Secrets ({secrets.length})
            </h3>
            
            {secrets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {secrets.map((secret) => (
                  <div
                    key={secret.name}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {secret.key}
                        </h4>
                        {secret.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {secret.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveSecret(secret.key)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {formatDate(secret.created_at)}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRevealSecret(secret.key)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center space-x-1"
                        >
                          {revealedSecrets.has(secret.key) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          <span>{revealedSecrets.has(secret.key) ? 'Hide' : 'Reveal'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleCopySecret(secret.key)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center"
                        >
                          {copiedSecrets.has(secret.key) ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No secrets stored
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add your first secret using the form above.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Info */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Security Information
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Secrets are encrypted with AES-256-GCM</li>
              <li>• Master password is protected by OS keychain</li>
              <li>• Vault auto-locks after 5 minutes of inactivity</li>
              <li>• All access is logged for security auditing</li>
              <li>• Secrets are never stored in plain text</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VaultTab
