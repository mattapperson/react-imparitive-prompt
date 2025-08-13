import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';

// Bun test compatibility layer for jest
const jest = {
  fn: mock,
  spyOn,
  useFakeTimers: () => {},
  useRealTimers: () => {},
  advanceTimersByTime: (ms: number) => {},
  clearAllTimers: () => {},
};
import { InputManager, input, initInput, inputManager } from '../inputManager';
import type { InputConfig, InputPrompt } from '../types';

describe('InputManager', () => {
  let manager: InputManager;

  beforeEach(() => {
    manager = new InputManager();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('init', () => {
    it('should initialize with valid config', () => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
      };
      
      expect(() => manager.init(config)).not.toThrow();
    });

    it('should throw if defaultRenderer is not provided', () => {
      const config = {
        renderers: { test: () => null as any },
      } as any;
      
      expect(() => manager.init(config)).toThrow('InputManager.init: defaultRenderer is required');
    });

    it('should warn if defaultRenderer not found in renderers', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const config: InputConfig = {
        renderers: {},
        defaultRenderer: 'missing',
      };
      
      manager.init(config);
      expect(consoleSpy).toHaveBeenCalledWith('InputManager.init: defaultRenderer not found in renderers map');
      consoleSpy.mockRestore();
    });
  });

  describe('input', () => {
    beforeEach(() => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
      };
      manager.init(config);
    });

    it('should throw if not initialized', async () => {
      const uninitManager = new InputManager();
      expect(() => uninitManager.input({ message: 'test' })).toThrow('InputManager.init() must be called first');
    });

    it('should create a promise and add to queue', async () => {
      const promise = manager.input({ message: 'test' });
      expect(promise).toBeInstanceOf(Promise);
      expect(manager.getCurrentPrompt()).toBeTruthy();
    });

    it('should handle multiple inputs in queue', async () => {
      const promise1 = manager.input({ message: 'first' });
      const promise2 = manager.input({ message: 'second' });
      
      expect(manager.getQueueLength()).toBe(1);
      const current = manager.getCurrentPrompt();
      expect(current?.message).toBe('first');
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const promise = manager.input({ 
        message: 'test',
        abortSignal: controller.signal,
      });
      
      controller.abort();
      const result = await promise;
      expect(result).toBeNull();
    });

    it('should handle timeout', async () => {
      const promise = manager.input({ 
        message: 'test',
        timeoutMs: 10,
      });
      
      // Wait for timeout to fire
      await new Promise(resolve => setTimeout(resolve, 20));
      const result = await promise;
      expect(result).toBeNull();
    });

    it('should cleanup abort listener after resolution', async () => {
      const controller = new AbortController();
      const removeEventListenerSpy = jest.spyOn(controller.signal, 'removeEventListener');
      
      manager.input({ 
        message: 'test',
        abortSignal: controller.signal,
      });
      
      const current = manager.getCurrentPrompt();
      manager.resolvePrompt(current!.id, 'value');
      
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    it('should handle abort while in queue', async () => {
      const controller = new AbortController();
      
      // Fill current slot
      manager.input({ message: 'first' });
      
      // Add to queue with abort signal
      const promise = manager.input({ 
        message: 'second',
        abortSignal: controller.signal,
      });
      
      controller.abort();
      const result = await promise;
      expect(result).toBeNull();
      expect(manager.getQueueLength()).toBe(0);
    });
  });

  describe('resolvePrompt', () => {
    beforeEach(() => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
      };
      manager.init(config);
    });

    it('should resolve current prompt', async () => {
      const promise = manager.input({ message: 'test' });
      const current = manager.getCurrentPrompt();
      
      manager.resolvePrompt(current!.id, 'resolved');
      const result = await promise;
      
      expect(result).toBe('resolved');
      expect(manager.getCurrentPrompt()).toBeNull();
    });

    it('should process queue after resolution', async () => {
      const promise1 = manager.input({ message: 'first' });
      const promise2 = manager.input({ message: 'second' });
      
      const first = manager.getCurrentPrompt();
      manager.resolvePrompt(first!.id, 'value1');
      
      await promise1;
      
      const second = manager.getCurrentPrompt();
      expect(second?.message).toBe('second');
    });

    it('should ignore resolution with wrong id', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      manager.input({ message: 'test' });
      
      manager.resolvePrompt('wrong-id', 'value');
      
      expect(consoleSpy).toHaveBeenCalledWith('resolvePrompt called with non-current id', { id: 'wrong-id' });
      expect(manager.getCurrentPrompt()).toBeTruthy();
      consoleSpy.mockRestore();
    });

    it('should do nothing if no current prompt', () => {
      manager.resolvePrompt('any-id', 'value');
      // Should not throw
      expect(manager.getCurrentPrompt()).toBeNull();
    });
  });

  describe('getRenderer', () => {
    it('should return null if not initialized', () => {
      const uninitManager = new InputManager();
      expect(uninitManager.getRenderer()).toBeNull();
    });

    it('should return renderer by kind', () => {
      const testRenderer = () => null as any;
      const config: InputConfig = {
        renderers: { 
          default: () => null as any,
          test: testRenderer,
        },
        defaultRenderer: 'default',
      };
      manager.init(config);
      
      expect(manager.getRenderer('test')).toBe(testRenderer);
    });

    it('should return default renderer if kind not provided', () => {
      const defaultRenderer = () => null as any;
      const config: InputConfig = {
        renderers: { 
          default: defaultRenderer,
        },
        defaultRenderer: 'default',
      };
      manager.init(config);
      
      expect(manager.getRenderer()).toBe(defaultRenderer);
    });

    it('should return null for unknown renderer', () => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
      };
      manager.init(config);
      
      expect(manager.getRenderer('unknown')).toBeNull();
    });
  });

  describe('handleMissingRenderer', () => {

    it('should handle throw policy', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
        onMissingRenderer: 'throw',
      };
      manager.init(config);
      
      const promise = manager.input({ message: 'test', kind: 'missing' });
      manager.handleMissingRenderer();
      
      const result = await promise;
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('No renderer for kind: missing');
      consoleSpy.mockRestore();
    });

    it('should handle reject policy', async () => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
        onMissingRenderer: 'reject',
      };
      manager.init(config);
      
      const promise = manager.input({ message: 'test' });
      manager.handleMissingRenderer();
      
      const result = await promise;
      expect(result).toBeNull();
    });

    it('should handle resolve-null policy (default)', async () => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
      };
      manager.init(config);
      
      const promise = manager.input({ message: 'test' });
      manager.handleMissingRenderer();
      
      const result = await promise;
      expect(result).toBeNull();
    });

    it('should do nothing if no current prompt', () => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
      };
      manager.init(config);
      
      manager.handleMissingRenderer();
      // Should not throw
      expect(manager.getCurrentPrompt()).toBeNull();
    });

    it('should do nothing if not initialized', () => {
      const uninitManager = new InputManager();
      uninitManager.handleMissingRenderer();
      // Should not throw
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers on state change', () => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
      };
      manager.init(config);
      
      const listener = jest.fn();
      const unsubscribe = manager.subscribe(listener);
      
      manager.input({ message: 'test' });
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
      listener.mockClear();
      
      const current = manager.getCurrentPrompt();
      manager.resolvePrompt(current!.id, 'value');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers', () => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
      };
      manager.init(config);
      
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      manager.subscribe(listener1);
      manager.subscribe(listener2);
      
      manager.input({ message: 'test' });
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('subscribeEvents', () => {
    beforeEach(() => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
      };
      manager.init(config);
    });

    it('should emit prompt:shown event', () => {
      const listener = jest.fn();
      manager.subscribeEvents(listener);
      
      manager.input({ message: 'test', kind: 'text' });
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'prompt:shown',
          kind: 'text',
        })
      );
    });

    it('should emit prompt:resolved event', async () => {
      const listener = jest.fn();
      manager.subscribeEvents(listener);
      
      const promise = manager.input({ message: 'test' });
      const current = manager.getCurrentPrompt();
      manager.resolvePrompt(current!.id, 'value');
      
      await promise;
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'prompt:resolved',
          id: current!.id,
        })
      );
    });

    it('should emit prompt:canceled event on abort', async () => {
      const listener = jest.fn();
      manager.subscribeEvents(listener);
      
      const controller = new AbortController();
      const promise = manager.input({ 
        message: 'test',
        abortSignal: controller.signal,
      });
      
      controller.abort();
      await promise;
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'prompt:canceled',
          reason: 'abort',
        })
      );
    });

    it('should emit prompt:canceled event on timeout', async () => {
      const listener = jest.fn();
      manager.subscribeEvents(listener);
      
      const promise = manager.input({ 
        message: 'test',
        timeoutMs: 10,
      });
      
      // Wait for timeout to fire
      await new Promise(resolve => setTimeout(resolve, 20));
      await promise;
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'prompt:canceled',
          reason: 'timeout',
        })
      );
    });

    it('should support unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = manager.subscribeEvents(listener);
      
      manager.input({ message: 'test' });
      expect(listener).toHaveBeenCalled();
      
      listener.mockClear();
      unsubscribe();
      
      const current = manager.getCurrentPrompt();
      manager.resolvePrompt(current!.id, 'value');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      const config: InputConfig = {
        renderers: { default: () => null as any },
        defaultRenderer: 'default',
      };
      manager.init(config);
    });

    it('should handle rapid successive inputs', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        manager.input({ message: `test${i}` })
      );
      
      expect(manager.getQueueLength()).toBe(9);
      
      for (let i = 0; i < 10; i++) {
        const current = manager.getCurrentPrompt();
        expect(current?.message).toBe(`test${i}`);
        manager.resolvePrompt(current!.id, `value${i}`);
        await promises[i];
      }
      
      const results = await Promise.all(promises);
      expect(results).toEqual(Array.from({ length: 10 }, (_, i) => `value${i}`));
    });

    it('should handle cancellation of non-existent prompt', async () => {
      // Private method, but testing through timeout path
      const promise = manager.input({ 
        message: 'test',
        timeoutMs: 100,
      });
      
      // Resolve before timeout
      const current = manager.getCurrentPrompt();
      manager.resolvePrompt(current!.id, 'value');
      
      await promise;
      // Timeout fires after resolution but should not cause issues
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should not cause issues
      expect(manager.getCurrentPrompt()).toBeNull();
    });

    it('should handle crypto.randomUUID fallback', () => {
      // Test UUID generation fallback
      const originalCrypto = globalThis.crypto;
      // @ts-ignore
      globalThis.crypto = undefined;
      
      const promise = manager.input({ message: 'test' });
      const current = manager.getCurrentPrompt();
      
      expect(current?.id).toBeTruthy();
      expect(typeof current?.id).toBe('string');
      
      // @ts-ignore
      globalThis.crypto = originalCrypto;
    });
  });
});

describe('module exports', () => {
  it('should export singleton inputManager', () => {
    expect(inputManager).toBeInstanceOf(InputManager);
  });

  it('should export input function', () => {
    expect(typeof input).toBe('function');
  });

  it('should export initInput function', () => {
    expect(typeof initInput).toBe('function');
  });

  it('should use singleton for input function', async () => {
    const config: InputConfig = {
      renderers: { default: () => null as any },
      defaultRenderer: 'default',
    };
    initInput(config);
    
    const promise = input({ message: 'test' });
    expect(inputManager.getCurrentPrompt()).toBeTruthy();
    
    const current = inputManager.getCurrentPrompt();
    inputManager.resolvePrompt(current!.id, 'value');
    
    const result = await promise;
    expect(result).toBe('value');
  });
});