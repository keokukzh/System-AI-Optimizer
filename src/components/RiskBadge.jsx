import React from 'react'

const RiskBadge = ({ level, size = 'sm' }) => {
  const getStyles = () => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full'
    
    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-2 text-base'
    }
    
    const colorStyles = {
      low: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      medium: 'bg-amber-100 text-amber-700 border border-amber-200',
      high: 'bg-red-100 text-red-700 border border-red-200'
    }
    
    return `${baseStyles} ${sizeStyles[size]} ${colorStyles[level]}`
  }

  const getIcon = () => {
    switch (level) {
      case 'low':
        return '✓'
      case 'medium':
        return '⚠'
      case 'high':
        return '⚠'
      default:
        return '?'
    }
  }

  return (
    <span className={getStyles()} title={`Risk level: ${level}`}>
      <span className="mr-1">{getIcon()}</span>
      {level}
    </span>
  )
}

export default RiskBadge
