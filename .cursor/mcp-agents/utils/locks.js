#!/usr/bin/env node

/**
 * Thread-safe lock implementation for MCP agents
 */

export class Lock {
  constructor() {
    this.locked = false;
    this.queue = [];
  }

  /**
   * Acquire the lock
   */
  async acquire(fn) {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.locked = true;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.locked = false;
          this.processQueue();
        }
      };

      if (!this.locked) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }

  /**
   * Process queued operations
   */
  processQueue() {
    if (this.queue.length > 0 && !this.locked) {
      const next = this.queue.shift();
      next();
    }
  }

  /**
   * Check if lock is currently held
   */
  isLocked() {
    return this.locked;
  }

  /**
   * Get queue length
   */
  getQueueLength() {
    return this.queue.length;
  }
}

/**
 * Create a new lock instance
 */
export function createLock() {
  return new Lock();
}

/**
 * Session manager with thread-safe operations
 */
export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.lock = new Lock();
  }

  /**
   * Create a new session
   */
  async create(sessionId, data = {}) {
    return await this.lock.acquire(async () => {
      if (this.sessions.has(sessionId)) {
        throw new Error(`Session ${sessionId} already exists`);
      }

      const session = {
        id: sessionId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data
      };

      this.sessions.set(sessionId, session);
      return session;
    });
  }

  /**
   * Get session by ID
   */
  async get(sessionId) {
    return await this.lock.acquire(async () => {
      return this.sessions.get(sessionId);
    });
  }

  /**
   * Update session data
   */
  async update(sessionId, data) {
    return await this.lock.acquire(async () => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      session.data = { ...session.data, ...data };
      session.updatedAt = Date.now();
      this.sessions.set(sessionId, session);
      return session;
    });
  }

  /**
   * Delete session
   */
  async delete(sessionId) {
    return await this.lock.acquire(async () => {
      return this.sessions.delete(sessionId);
    });
  }

  /**
   * Get all sessions
   */
  async getAll() {
    return await this.lock.acquire(async () => {
      return Array.from(this.sessions.values());
    });
  }

  /**
   * Clear all sessions
   */
  async clear() {
    return await this.lock.acquire(async () => {
      this.sessions.clear();
    });
  }

  /**
   * Get session count
   */
  async count() {
    return await this.lock.acquire(async () => {
      return this.sessions.size;
    });
  }
}

export default { Lock, createLock, SessionManager };
