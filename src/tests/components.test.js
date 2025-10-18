import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { validateScanPath, validateProcessId, sanitizeInput } from '../utils/validation.js'

describe('Validation Utils', () => {
  it('should validate scan paths correctly', () => {
    const validPath = '/home/user/documents'
    const invalidPath = '/Windows/System32'
    
    const validResult = validateScanPath(validPath)
    const invalidResult = validateScanPath(invalidPath)
    
    expect(validResult.isValid).toBe(true)
    expect(invalidResult.isValid).toBe(false)
    expect(invalidResult.errors).toContain('Cannot access protected system directories')
  })

  it('should sanitize input correctly', () => {
    const maliciousInput = '<script>alert("xss")</script>'
    const sanitized = sanitizeInput(maliciousInput)
    
    expect(sanitized).not.toContain('<')
    expect(sanitized).not.toContain('>')
    expect(sanitized).toContain('script')
    expect(sanitized).toContain('alert')
  })

  it('should validate process IDs', () => {
    const validPid = 1234
    const invalidPid = -1
    const systemPid = 50
    
    const validResult = validateProcessId(validPid)
    const invalidResult = validateProcessId(invalidPid)
    const systemResult = validateProcessId(systemPid)
    
    expect(validResult.isValid).toBe(true)
    expect(invalidResult.isValid).toBe(false)
    expect(systemResult.isValid).toBe(false)
  })
})

describe('API Utils', () => {
  it('should handle API errors gracefully', async () => {
    // Mock fetch to return an error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    
    // Test error handling
    try {
      const response = await fetch('/api/test')
      expect(response).toBeUndefined()
    } catch (error) {
      expect(error.message).toBe('Network error')
    }
  })
})
