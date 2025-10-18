import React, { useState } from 'react'
import { ChevronRight, ArrowUp, Folder, File } from 'lucide-react'

const TreemapWithBreadcrumb = ({ data, onNodeClick }) => {
  const [stack, setStack] = useState([{ name: 'Root', children: data, path: '/' }])
  
  const current = stack[stack.length - 1]
  
  const handleNodeClick = (node) => {
    if (node.children && node.children.length > 0) {
      setStack([...stack, node])
    }
    if (onNodeClick) {
      onNodeClick(node)
    }
  }
  
  const goUp = () => {
    if (stack.length > 1) {
      setStack(stack.slice(0, -1))
    }
  }
  
  const goToLevel = (index) => {
    setStack(stack.slice(0, index + 1))
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getNodeColor = (node, index) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {stack.map((node, index) => (
          <React.Fragment key={index}>
            <button
              onClick={() => goToLevel(index)}
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                index === stack.length - 1
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {index === 0 ? <Folder className="w-4 h-4" /> : null}
              {node.name}
            </button>
            {index < stack.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </React.Fragment>
        ))}
        
        {stack.length > 1 && (
          <button
            onClick={goUp}
            className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            <ArrowUp className="w-4 h-4" />
            Up
          </button>
        )}
      </div>

      {/* Treemap */}
      <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
        {current.children && current.children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {current.children.map((node, index) => {
              const hasChildren = node.children && node.children.length > 0
              const sizePercent = (node.size / current.children.reduce((sum, n) => sum + n.size, 0)) * 100
              
              return (
                <div
                  key={index}
                  onClick={() => handleNodeClick(node)}
                  className={`relative p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    hasChildren ? 'hover:scale-105' : ''
                  }`}
                  style={{ 
                    backgroundColor: getNodeColor(node, index),
                    minHeight: '80px'
                  }}
                >
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-1">
                      {hasChildren ? (
                        <Folder className="w-4 h-4" />
                      ) : (
                        <File className="w-4 h-4" />
                      )}
                      <span className="font-medium text-sm truncate">
                        {node.name}
                      </span>
                    </div>
                    
                    <div className="text-xs opacity-90">
                      {formatBytes(node.size)}
                    </div>
                    
                    {sizePercent >= 2 && (
                      <div className="text-xs opacity-75 mt-1">
                        {sizePercent.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  
                  {/* Tooltip for small nodes */}
                  {sizePercent < 2 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {node.name}: {formatBytes(node.size)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No files in this directory</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TreemapWithBreadcrumb
