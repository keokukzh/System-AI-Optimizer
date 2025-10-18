import React from 'react'

const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="glass-card space-y-4 animate-fadeIn">
            <div className="skeleton-title" />
            <div className="skeleton-text w-full" />
            <div className="skeleton-text w-5/6" />
            <div className="skeleton-text w-4/6" />
          </div>
        )

      case 'table-row':
        return (
          <div className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg animate-fadeIn">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-text w-1/3" />
              <div className="skeleton-text w-1/2" />
            </div>
            <div className="skeleton w-20 h-8 rounded" />
          </div>
        )

      case 'stat-card':
        return (
          <div className="glass-card animate-fadeIn">
            <div className="skeleton h-8 w-16 mb-2" />
            <div className="skeleton-text w-24" />
            <div className="skeleton h-3 w-20 mt-2" />
          </div>
        )

      case 'process-row':
        return (
          <div className="grid grid-cols-6 gap-4 p-4 bg-white/50 rounded-lg animate-fadeIn">
            <div className="col-span-2 space-y-2">
              <div className="skeleton-text w-full" />
              <div className="skeleton-text w-3/4" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton-text w-full" />
            <div className="skeleton-text w-full" />
            <div className="flex space-x-2">
              <div className="skeleton w-8 h-8 rounded" />
              <div className="skeleton w-8 h-8 rounded" />
            </div>
          </div>
        )

      default:
        return <div className="skeleton h-32" />
    }
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  )
}

export default LoadingSkeleton
