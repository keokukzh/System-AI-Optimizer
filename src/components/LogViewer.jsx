import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  Filter, 
  Search,
  AlertTriangle,
  Info,
  AlertCircle,
  XCircle,
  Bug
} from 'lucide-react';

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({
    level: 'all',
    component: 'all',
    search: ''
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [maxLines, setMaxLines] = useState(1000);
  
  const logContainerRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const logLevels = [
    { value: 'all', label: 'All Levels', icon: FileText, color: 'text-gray-500' },
    { value: 'debug', label: 'Debug', icon: Bug, color: 'text-gray-400' },
    { value: 'info', label: 'Info', icon: Info, color: 'text-blue-500' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-yellow-500' },
    { value: 'error', label: 'Error', icon: AlertCircle, color: 'text-red-500' },
    { value: 'critical', label: 'Critical', icon: XCircle, color: 'text-red-700' }
  ];

  const components = [
    'all',
    'LLM',
    'Scanner',
    'Storage',
    'Process',
    'Startup',
    'Optimization',
    'Metrics',
    'API'
  ];

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const logEntries = await invoke('get_logs', { lines: maxLines });
      setLogs(logEntries);
      
      // Get log stats
      const logStats = await invoke('get_log_stats');
      setStats(logStats);
      
    } catch (err) {
      setError(err.message || 'Failed to load logs');
      console.error('Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }
    
    try {
      await invoke('clear_logs');
      await loadLogs();
    } catch (err) {
      setError(err.message || 'Failed to clear logs');
    }
  };

  const downloadLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()} ${log.component}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optiai-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const applyFilters = () => {
    let filtered = logs;
    
    // Filter by level
    if (filter.level !== 'all') {
      filtered = filtered.filter(log => log.level.toLowerCase() === filter.level);
    }
    
    // Filter by component
    if (filter.component !== 'all') {
      filtered = filtered.filter(log => log.component === filter.component);
    }
    
    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        log.component.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredLogs(filtered);
  };

  const getLogLevelIcon = (level) => {
    const levelInfo = logLevels.find(l => l.value === level.toLowerCase());
    return levelInfo ? levelInfo.icon : FileText;
  };

  const getLogLevelColor = (level) => {
    const levelInfo = logLevels.find(l => l.value === level.toLowerCase());
    return levelInfo ? levelInfo.color : 'text-gray-500';
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  // Load logs on component mount
  useEffect(() => {
    loadLogs();
  }, [maxLines]);

  // Apply filters when logs or filter changes
  useEffect(() => {
    applyFilters();
  }, [logs, filter]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(loadLogs, 5000); // Refresh every 5 seconds
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Scroll to bottom when new logs arrive
  useEffect(() => {
    scrollToBottom();
  }, [filteredLogs]);

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark-text flex items-center gap-2">
            <FileText className="w-5 h-5" />
            System Logs
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={downloadLogs}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            
            <button
              onClick={clearLogs}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-dark-surface rounded-lg p-3">
              <div className="text-sm text-dark-muted">Total Files</div>
              <div className="text-lg font-semibold text-dark-text">{stats.total_files}</div>
            </div>
            <div className="bg-dark-surface rounded-lg p-3">
              <div className="text-sm text-dark-muted">Total Size</div>
              <div className="text-lg font-semibold text-dark-text">
                {(stats.total_size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
            <div className="bg-dark-surface rounded-lg p-3">
              <div className="text-sm text-dark-muted">Log Entries</div>
              <div className="text-lg font-semibold text-dark-text">{filteredLogs.length}</div>
            </div>
            <div className="bg-dark-surface rounded-lg p-3">
              <div className="text-sm text-dark-muted">Retention</div>
              <div className="text-lg font-semibold text-dark-text">{stats.retention_days} days</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-muted" />
            <select
              value={filter.level}
              onChange={(e) => setFilter(prev => ({ ...prev, level: e.target.value }))}
              className="bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-dark-text"
            >
              {logLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
          
          <select
            value={filter.component}
            onChange={(e) => setFilter(prev => ({ ...prev, component: e.target.value }))}
            className="bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-dark-text"
          >
            {components.map(component => (
              <option key={component} value={component}>
                {component === 'all' ? 'All Components' : component}
              </option>
            ))}
          </select>
          
          <div className="flex items-center gap-2 flex-1 min-w-64">
            <Search className="w-4 h-4 text-dark-muted" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="flex-1 bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-dark-text placeholder-dark-muted"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-dark-muted">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto Refresh
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-dark-muted">Max Lines:</label>
            <select
              value={maxLines}
              onChange={(e) => setMaxLines(parseInt(e.target.value))}
              className="bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-dark-text"
            >
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={5000}>5000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 m-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Logs Container */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-dark-muted py-8">
            {loading ? 'Loading logs...' : 'No logs found'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => {
              const LevelIcon = getLogLevelIcon(log.level);
              const levelColor = getLogLevelColor(log.level);
              
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-dark-surface/50 transition-colors"
                >
                  <LevelIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${levelColor}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-dark-muted">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span className={`text-xs font-medium ${levelColor}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                        {log.component}
                      </span>
                    </div>
                    
                    <div className="text-dark-text break-words">
                      {log.message}
                    </div>
                    
                    {log.context && (
                      <details className="mt-2">
                        <summary className="text-xs text-dark-muted cursor-pointer hover:text-dark-text">
                          Context
                        </summary>
                        <pre className="text-xs text-dark-muted mt-1 bg-dark-surface p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
