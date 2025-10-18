import React, { useState } from 'react'
import { Search, Download, ExternalLink, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

const DiscoverTab = ({ onInstallApp }) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://127.0.0.1:5174/api/ai/tools/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setSuggestions(data.suggestions || [])
      } else {
        setError(data.error || 'Failed to get suggestions')
      }
    } catch (err) {
      setError(`Search failed: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900'
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900'
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'github': return <Download className="w-4 h-4" />
      case 'app': return <CheckCircle className="w-4 h-4" />
      case 'package': return <Download className="w-4 h-4" />
      case 'web': return <ExternalLink className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const handleInstall = async (suggestion) => {
    if (suggestion.type === 'github') {
      // Install GitHub repository
      onInstallApp(suggestion.url)
    } else {
      // For other types, open URL
      window.open(suggestion.url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Discover Tools</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Describe what you want to do and get AI-powered tool recommendations
        </p>
      </div>

      {/* Search Input */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to do... (e.g., 'find duplicate photos and clean them up')"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Search className="w-5 h-5" />
          )}
          <span>Search</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recommended Tools ({suggestions.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(suggestion.type)}
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {suggestion.name}
                    </h4>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(suggestion.risk)}`}>
                    {suggestion.risk} risk
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {suggestion.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Source:</span>
                    <a
                      href={suggestion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      {suggestion.url}
                    </a>
                  </div>

                  {suggestion.install && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <span>Install:</span> {suggestion.install.description}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleInstall(suggestion)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center justify-center space-x-1"
                  >
                    {suggestion.type === 'github' ? (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Install</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        <span>Open</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => window.open(suggestion.url, '_blank')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && suggestions.length === 0 && query && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tools found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try a different search term or be more specific about what you want to do.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!query && suggestions.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Discover Tools with AI
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Describe what you want to accomplish and get personalized tool recommendations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Example Queries</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• "Find duplicate photos"</li>
                <li>• "Clean up disk space"</li>
                <li>• "Compress large files"</li>
                <li>• "Optimize system performance"</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tool Types</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• GitHub repositories</li>
                <li>• Desktop applications</li>
                <li>• Package manager tools</li>
                <li>• Web-based utilities</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscoverTab
