/**
 * Input validation utilities for OptiAI
 */

// Validation rules
export const VALIDATION_RULES = {
  // Path validation
  PATH: {
    REQUIRED: (value) => value && value.trim().length > 0,
    VALID_PATH: (value) => {
      if (!value) return false;
      // Basic path validation - no empty segments, no invalid characters
      const invalidChars = /[<>:"|?*\x00-\x1f]/;
      return !invalidChars.test(value);
    },
    NOT_PROTECTED: (value) => {
      if (!value) return false;
      const protectedPaths = [
        'C:\\Windows',
        'C:\\Program Files',
        'C:\\Program Files (x86)',
        'C:\\System Volume Information',
        'C:\\$Recycle.Bin',
        '/Windows',
        '/System',
        '/usr',
        '/etc',
        '/Library',
        '/System/Volumes/Data'
      ];
      
      const normalizedPath = value.replace(/\\/g, '/').toLowerCase();
      return !protectedPaths.some(protectedPath => 
        normalizedPath.startsWith(protectedPath.replace(/\\/g, '/').toLowerCase())
      );
    },
    EXISTS: async (value) => {
      if (!value) return false;
      try {
        // This would need to be implemented with Tauri API
        // For now, return true as a placeholder
        return true;
      } catch {
        return false;
      }
    }
  },
  
  // File size validation
  FILE_SIZE: {
    MAX_SIZE: (size, maxBytes) => size <= maxBytes,
    MIN_SIZE: (size, minBytes) => size >= minBytes
  },
  
  // Process validation
  PROCESS: {
    VALID_PID: (pid) => Number.isInteger(pid) && pid > 0,
    NOT_SYSTEM: (pid) => {
      // System processes typically have PIDs < 100
      return pid >= 100;
    }
  },
  
  // Settings validation
  SETTINGS: {
    SCAN_DEPTH: (depth) => Number.isInteger(depth) && depth >= 1 && depth <= 10,
    TIMEOUT: (timeout) => Number.isInteger(timeout) && timeout >= 1000 && timeout <= 300000,
    RETRY_COUNT: (count) => Number.isInteger(count) && count >= 0 && count <= 10
  },
  
  // AI settings validation
  AI: {
    MODEL_NAME: (name) => name && name.trim().length > 0 && name.length <= 100,
    SERVER_URL: (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
    TEMPERATURE: (temp) => typeof temp === 'number' && temp >= 0 && temp <= 2
  }
};

// Validation error messages
export const VALIDATION_MESSAGES = {
  PATH: {
    REQUIRED: 'Path is required',
    INVALID: 'Invalid path format',
    PROTECTED: 'Cannot access protected system directories',
    NOT_EXISTS: 'Path does not exist',
    NO_PERMISSION: 'No permission to access this path'
  },
  FILE_SIZE: {
    TOO_LARGE: 'File size exceeds maximum limit',
    TOO_SMALL: 'File size is below minimum limit'
  },
  PROCESS: {
    INVALID_PID: 'Invalid process ID',
    SYSTEM_PROCESS: 'Cannot modify system processes'
  },
  SETTINGS: {
    INVALID_DEPTH: 'Scan depth must be between 1 and 10',
    INVALID_TIMEOUT: 'Timeout must be between 1 and 300 seconds',
    INVALID_RETRY: 'Retry count must be between 0 and 10'
  },
  AI: {
    INVALID_MODEL: 'Invalid model name',
    INVALID_URL: 'Invalid server URL',
    INVALID_TEMPERATURE: 'Temperature must be between 0 and 2'
  }
};

/**
 * Validates a value against multiple rules
 */
export const validate = (value, rules, customMessages = {}) => {
  const errors = [];
  
  for (const [ruleName, rule] of Object.entries(rules)) {
    if (typeof rule === 'function') {
      if (!rule(value)) {
        const message = customMessages[ruleName] || 
                       VALIDATION_MESSAGES[ruleName] || 
                       `Validation failed for ${ruleName}`;
        errors.push(message);
      }
    } else if (typeof rule === 'object' && rule.rule) {
      if (!rule.rule(value)) {
        const message = customMessages[ruleName] || 
                       rule.message || 
                       `Validation failed for ${ruleName}`;
        errors.push(message);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates a scan directory path
 */
export const validateScanPath = (path) => {
  return validate(path, {
    required: VALIDATION_RULES.PATH.REQUIRED,
    valid: VALIDATION_RULES.PATH.VALID_PATH,
    notProtected: VALIDATION_RULES.PATH.NOT_PROTECTED
  }, {
    required: VALIDATION_MESSAGES.PATH.REQUIRED,
    valid: VALIDATION_MESSAGES.PATH.INVALID,
    notProtected: VALIDATION_MESSAGES.PATH.PROTECTED
  });
};

/**
 * Validates process ID
 */
export const validateProcessId = (pid) => {
  return validate(pid, {
    valid: VALIDATION_RULES.PROCESS.VALID_PID,
    notSystem: VALIDATION_RULES.PROCESS.NOT_SYSTEM
  }, {
    valid: VALIDATION_MESSAGES.PROCESS.INVALID_PID,
    notSystem: VALIDATION_MESSAGES.PROCESS.SYSTEM_PROCESS
  });
};

/**
 * Validates settings object
 */
export const validateSettings = (settings) => {
  const errors = {};
  
  if (settings.scanDepth !== undefined) {
    const result = validate(settings.scanDepth, {
      valid: VALIDATION_RULES.SETTINGS.SCAN_DEPTH
    });
    if (!result.isValid) {
      errors.scanDepth = result.errors[0];
    }
  }
  
  if (settings.timeout !== undefined) {
    const result = validate(settings.timeout, {
      valid: VALIDATION_RULES.SETTINGS.TIMEOUT
    });
    if (!result.isValid) {
      errors.timeout = result.errors[0];
    }
  }
  
  if (settings.retryCount !== undefined) {
    const result = validate(settings.retryCount, {
      valid: VALIDATION_RULES.SETTINGS.RETRY_COUNT
    });
    if (!result.isValid) {
      errors.retryCount = result.errors[0];
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates AI settings
 */
export const validateAISettings = (aiSettings) => {
  const errors = {};
  
  if (aiSettings.modelName !== undefined) {
    const result = validate(aiSettings.modelName, {
      valid: VALIDATION_RULES.AI.MODEL_NAME
    });
    if (!result.isValid) {
      errors.modelName = result.errors[0];
    }
  }
  
  if (aiSettings.serverUrl !== undefined) {
    const result = validate(aiSettings.serverUrl, {
      valid: VALIDATION_RULES.AI.SERVER_URL
    });
    if (!result.isValid) {
      errors.serverUrl = result.errors[0];
    }
  }
  
  if (aiSettings.temperature !== undefined) {
    const result = validate(aiSettings.temperature, {
      valid: VALIDATION_RULES.AI.TEMPERATURE
    });
    if (!result.isValid) {
      errors.temperature = result.errors[0];
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitizes input to prevent XSS and other attacks
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validates and sanitizes user input
 */
export const validateAndSanitize = (input, rules, customMessages = {}) => {
  const sanitized = sanitizeInput(input);
  const validation = validate(sanitized, rules, customMessages);
  
  return {
    ...validation,
    sanitized
  };
};

export default {
  VALIDATION_RULES,
  VALIDATION_MESSAGES,
  validate,
  validateScanPath,
  validateProcessId,
  validateSettings,
  validateAISettings,
  sanitizeInput,
  validateAndSanitize
};
