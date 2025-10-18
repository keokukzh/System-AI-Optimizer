import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const LiveMetrics = () => {
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5174/api/metrics')
        if (response.ok) {
          const data = await response.json()
          setMetrics(data)
          setError(null)
          
          // Add to history for charts
          setHistory(prev => {
            const newHistory = [...prev, {
              timestamp: new Date(data.timestamp).toLocaleTimeString(),
              cpu: data.cpu.percent,
              memory: data.memory.percent,
              disk: data.disk.percent
            }]
            // Keep only last 20 data points
            return newHistory.slice(-20)
          })
        } else {
          setError('Failed to fetch metrics')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setIsLoading(false)
      }
    }

    // Fetch immediately
    fetchMetrics()
    
    // Set up interval for live updates
    const interval = setInterval(fetchMetrics, 2000) // Update every 2 seconds
    
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (percent) => {
    if (percent < 50) return 'text-green-600'
    if (percent < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Live System Metrics</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Live System Metrics</h3>
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">
          <p>Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CPU Usage</p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.cpu.percent)}`}>
                {metrics.cpu.percent.toFixed(1)}%
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>{metrics.cpu.count} cores</p>
              {metrics.cpu.frequency.current && (
                <p>{(metrics.cpu.frequency.current / 1000).toFixed(1)} GHz</p>
              )}
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.memory.percent)}`}>
                {metrics.memory.percent.toFixed(1)}%
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>{formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}</p>
              <p>{formatBytes(metrics.memory.available)} available</p>
            </div>
          </div>
        </div>

        {/* Disk */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disk Usage</p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.disk.percent)}`}>
                {metrics.disk.percent.toFixed(1)}%
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>{formatBytes(metrics.disk.used)} / {formatBytes(metrics.disk.total)}</p>
              <p>{formatBytes(metrics.disk.free)} free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Charts */}
      {history.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold mb-4">Usage Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="cpu" 
                stackId="1" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                name="CPU"
              />
              <Area 
                type="monotone" 
                dataKey="memory" 
                stackId="2" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
                name="Memory"
              />
              <Area 
                type="monotone" 
                dataKey="disk" 
                stackId="3" 
                stroke="#f59e0b" 
                fill="#f59e0b" 
                fillOpacity={0.3}
                name="Disk"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Network Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold mb-4">Network Activity</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Bytes Sent</p>
            <p className="text-lg font-semibold">{formatBytes(metrics.network.bytes_sent)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Bytes Received</p>
            <p className="text-lg font-semibold">{formatBytes(metrics.network.bytes_recv)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Packets Sent</p>
            <p className="text-lg font-semibold">{metrics.network.packets_sent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Packets Received</p>
            <p className="text-lg font-semibold">{metrics.network.packets_recv.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveMetrics
