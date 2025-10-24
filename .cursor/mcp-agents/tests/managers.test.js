#!/usr/bin/env node

/**
 * Unit tests for MCP Agent Managers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Lock, SessionManager } from '../utils/locks.js';

describe('Lock', () => {
  let lock;

  beforeEach(() => {
    lock = new Lock();
  });

  it('should create a lock instance', () => {
    expect(lock).toBeDefined();
    expect(lock.isLocked()).toBe(false);
  });

  it('should acquire and release lock', async () => {
    let executed = false;
    
    await lock.acquire(async () => {
      executed = true;
      expect(lock.isLocked()).toBe(true);
    });
    
    expect(executed).toBe(true);
    expect(lock.isLocked()).toBe(false);
  });

  it('should queue operations when locked', async () => {
    const results = [];
    
    // Start multiple async operations
    const promises = [
      lock.acquire(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        results.push(1);
      }),
      lock.acquire(async () => {
        results.push(2);
      }),
      lock.acquire(async () => {
        results.push(3);
      })
    ];
    
    await Promise.all(promises);
    
    // Should execute in order
    expect(results).toEqual([1, 2, 3]);
  });

  it('should handle errors and release lock', async () => {
    const error = new Error('Test error');
    
    await expect(
      lock.acquire(async () => {
        throw error;
      })
    ).rejects.toThrow('Test error');
    
    // Lock should be released after error
    expect(lock.isLocked()).toBe(false);
  });

  it('should process queued operations after error', async () => {
    const results = [];
    
    const promises = [
      lock.acquire(async () => {
        throw new Error('First fails');
      }).catch(() => {
        results.push('error');
      }),
      lock.acquire(async () => {
        results.push('success');
      })
    ];
    
    await Promise.all(promises);
    
    expect(results).toEqual(['error', 'success']);
  });
});

describe('SessionManager', () => {
  let sessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  afterEach(async () => {
    await sessionManager.clear();
  });

  it('should create a session', async () => {
    const session = await sessionManager.create('test-session', { foo: 'bar' });
    
    expect(session).toBeDefined();
    expect(session.id).toBe('test-session');
    expect(session.data.foo).toBe('bar');
    expect(session.createdAt).toBeDefined();
    expect(session.updatedAt).toBeDefined();
  });

  it('should not create duplicate sessions', async () => {
    await sessionManager.create('test-session');
    
    await expect(
      sessionManager.create('test-session')
    ).rejects.toThrow('Session test-session already exists');
  });

  it('should get a session by ID', async () => {
    await sessionManager.create('test-session', { value: 123 });
    
    const session = await sessionManager.get('test-session');
    
    expect(session).toBeDefined();
    expect(session.id).toBe('test-session');
    expect(session.data.value).toBe(123);
  });

  it('should update session data', async () => {
    await sessionManager.create('test-session', { count: 0 });
    
    const updated = await sessionManager.update('test-session', { count: 1, extra: 'data' });
    
    expect(updated.data.count).toBe(1);
    expect(updated.data.extra).toBe('data');
    expect(updated.updatedAt).toBeGreaterThan(updated.createdAt);
  });

  it('should throw error when updating non-existent session', async () => {
    await expect(
      sessionManager.update('non-existent', { foo: 'bar' })
    ).rejects.toThrow('Session non-existent not found');
  });

  it('should delete a session', async () => {
    await sessionManager.create('test-session');
    
    const deleted = await sessionManager.delete('test-session');
    expect(deleted).toBe(true);
    
    const session = await sessionManager.get('test-session');
    expect(session).toBeUndefined();
  });

  it('should get all sessions', async () => {
    await sessionManager.create('session-1', { id: 1 });
    await sessionManager.create('session-2', { id: 2 });
    await sessionManager.create('session-3', { id: 3 });
    
    const sessions = await sessionManager.getAll();
    
    expect(sessions).toHaveLength(3);
    expect(sessions.map(s => s.id)).toContain('session-1');
    expect(sessions.map(s => s.id)).toContain('session-2');
    expect(sessions.map(s => s.id)).toContain('session-3');
  });

  it('should get session count', async () => {
    expect(await sessionManager.count()).toBe(0);
    
    await sessionManager.create('session-1');
    await sessionManager.create('session-2');
    
    expect(await sessionManager.count()).toBe(2);
  });

  it('should clear all sessions', async () => {
    await sessionManager.create('session-1');
    await sessionManager.create('session-2');
    
    await sessionManager.clear();
    
    expect(await sessionManager.count()).toBe(0);
  });

  it('should be thread-safe', async () => {
    const promises = [];
    
    // Create multiple sessions concurrently
    for (let i = 0; i < 10; i++) {
      promises.push(
        sessionManager.create(`session-${i}`, { index: i })
      );
    }
    
    await Promise.all(promises);
    
    expect(await sessionManager.count()).toBe(10);
  });
});

describe('BaseMCPManager', () => {
  // Note: BaseMCPManager tests would require mocking the process spawning
  // These tests are placeholders for the actual implementation
  
  it('should be tested with mock implementations', () => {
    // TODO: Implement tests with mocked child_process
    expect(true).toBe(true);
  });
});
