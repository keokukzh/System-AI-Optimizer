import React, { useState, useMemo } from 'react'
import { Folder, File, HardDrive } from 'lucide-react'

const TreemapVisualization = ({ data = [] }) => {
  const [selectedNode, setSelectedNode] = useState(null)
  const [maxDepth, setMaxDepth] = useState(3)

  // Process data into treemap structure
  const treemapData = useMemo(() => {
    if (!data || data.length === 0) {
      return { children: [], totalSize: 0 }
    }

    // Group files by directory
    const directoryMap = new Map()
    let totalSize = 0

    data.forEach(item => {
      totalSize += item.bytes || 0
      
      if (item.kind === 'dir') {
        directoryMap.set(item.path, {
          ...item,
          children: [],
          totalSize: item.bytes || 0
        })
      }
    })

    // Add files to their parent directories
    data.forEach(item => {
      if (item.kind === 'file') {
        const pathParts = item.path.split('/')
        const parentPath = pathParts.slice(0, -1).join('/') || '/'
        
        if (directoryMap.has(parentPath)) {
          directoryMap.get(parentPath).children.push(item)
          directoryMap.get(parentPath).totalSize += item.bytes || 0
        }
      }
    })

    // Convert to array and sort by size
    const directories = Array.from(directoryMap.values())
      .sort((a, b) => b.totalSize - a.totalSize)
      .slice(0, 20) // Limit to top 20 directories

    return {
      children: directories,
      totalSize
    }
  }, [data])

  // Calculate treemap layout
  const layoutNodes = useMemo(() => {
    if (!treemapData.children.length) return []

    const containerWidth = 400
    const containerHeight = 300
    const nodes = []

    // Simple treemap algorithm (squarified)
    const squarify = (children, x, y, width, height) => {
      if (children.length === 0) return

      const totalArea = children.reduce((sum, child) => sum + child.totalSize, 0)
      const aspectRatio = width / height

      // Sort children by size (descending)
      const sorted = [...children].sort((a, b) => b.totalSize - a.totalSize)

      let row = []
      let rowWidth = 0
      let rowHeight = 0
      let currentY = y

      for (let i = 0; i < sorted.length; i++) {
        const child = sorted[i]
        const newRow = [...row, child]
        const newRowWidth = rowWidth + child.totalSize
        const newRowHeight = (newRowWidth * height) / totalArea

        // Check if adding this child improves aspect ratio
        const currentWorstRatio = Math.max(...row.map(item => 
          Math.max(item.totalSize / (rowHeight * rowWidth / row.length), 
                  (rowHeight * rowWidth / row.length) / item.totalSize)
        ))
        const newWorstRatio = Math.max(...newRow.map(item => 
          Math.max(item.totalSize / (newRowHeight * newRowWidth / newRow.length), 
                  (newRowHeight * newRowWidth / newRow.length) / item.totalSize)
        ))

        if (row.length === 0 || newWorstRatio <= currentWorstRatio) {
          row = newRow
          rowWidth = newRowWidth
          rowHeight = newRowHeight
        } else {
          // Layout current row
          let currentX = x
          const itemWidth = width / row.length
          
          row.forEach(item => {
            const itemHeight = (item.totalSize * height) / totalArea
            nodes.push({
              ...item,
              x: currentX,
              y: currentY,
              width: itemWidth,
              height: itemHeight,
              depth: 0
            })
            currentX += itemWidth
          })

          // Start new row
          currentY += rowHeight
          row = [child]
          rowWidth = child.totalSize
          rowHeight = (rowWidth * height) / totalArea
        }
      }

      // Layout remaining row
      if (row.length > 0) {
        let currentX = x
        const itemWidth = width / row.length
        
        row.forEach(item => {
          const itemHeight = (item.totalSize * height) / totalArea
          nodes.push({
            ...item,
            x: currentX,
            y: currentY,
            width: itemWidth,
            height: itemHeight,
            depth: 0
          })
          currentX += itemWidth
        })
      }
    }

    squarify(treemapData.children, 0, 0, containerWidth, containerHeight)
    return nodes
  }, [treemapData])

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getNodeColor = (node) => {
    const size = node.totalSize || node.bytes || 0
    const maxSize = Math.max(...layoutNodes.map(n => n.totalSize || n.bytes || 0))
    const intensity = Math.min(size / maxSize, 1)
    
    // Color based on size (blue gradient)
    const hue = 220 - (intensity * 60) // Blue to purple
    const saturation = 70 + (intensity * 30)
    const lightness = 85 - (intensity * 25)
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <HardDrive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No scan data available</p>
          <p className="text-sm">Start a system scan to see disk usage</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Max Depth:
          </label>
          <select
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
            className="input text-sm w-20"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-500">
          Total: {formatBytes(treemapData.totalSize)}
        </div>
      </div>

      {/* Treemap */}
      <div className="treemap-container" style={{ height: '300px' }}>
        {layoutNodes.map((node, index) => (
          <div
            key={index}
            className="treemap-node"
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: `${node.width}px`,
              height: `${node.height}px`,
              backgroundColor: getNodeColor(node),
              minWidth: '20px',
              minHeight: '20px'
            }}
            onClick={() => setSelectedNode(node)}
            title={`${node.path}\n${formatBytes(node.totalSize || node.bytes)}`}
          >
            {node.width > 40 && node.height > 20 && (
              <div className="treemap-label">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    {node.kind === 'dir' ? (
                      <Folder className="w-3 h-3 mr-1" />
                    ) : (
                      <File className="w-3 h-3 mr-1" />
                    )}
                  </div>
                  <div className="text-xs font-medium truncate px-1">
                    {node.path.split('/').pop() || node.path}
                  </div>
                  <div className="text-xs opacity-75">
                    {formatBytes(node.totalSize || node.bytes)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="card">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Item</h4>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Path:</span> {selectedNode.path}
            </div>
            <div>
              <span className="font-medium">Size:</span> {formatBytes(selectedNode.totalSize || selectedNode.bytes)}
            </div>
            <div>
              <span className="font-medium">Type:</span> {selectedNode.kind}
            </div>
            {selectedNode.children && (
              <div>
                <span className="font-medium">Items:</span> {selectedNode.children.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center">
          <Folder className="w-3 h-3 mr-1" />
          Directory
        </div>
        <div className="flex items-center">
          <File className="w-3 h-3 mr-1" />
          File
        </div>
        <div className="text-xs">
          Size: Larger = More space used
        </div>
      </div>
    </div>
  )
}

export default TreemapVisualization
