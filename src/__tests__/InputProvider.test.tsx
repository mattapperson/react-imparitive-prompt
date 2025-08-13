import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';

const jest = {
  fn: mock,
  spyOn,
};
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { screen, fireEvent, waitFor } from './test-utils';
import { InputProvider } from '../InputProvider';
import { inputManager } from '../inputManager';
import type { InputConfig, RendererProps } from '../types';

describe('InputProvider', () => {
  beforeEach(() => {
    cleanup();
    // Clear any existing state from inputManager
    while (inputManager.getCurrentPrompt()) {
      const current = inputManager.getCurrentPrompt();
      if (current) {
        inputManager.resolvePrompt(current.id, null);
      }
    }
    // Clear the queue
    while (inputManager.getQueueLength() > 0) {
      const current = inputManager.getCurrentPrompt();
      if (!current && inputManager.getQueueLength() > 0) {
        // Force process the queue
        (inputManager as any).processQueue();
      }
      if (current) {
        inputManager.resolvePrompt(current.id, null);
      }
    }
    
    // Initialize with a test renderer
    const config: InputConfig = {
      renderers: {
        default: TestRenderer,
        test: TestRenderer,
      },
      defaultRenderer: 'default',
    };
    inputManager.init(config);
  });

  afterEach(() => {
    cleanup();
    // Clean up any pending prompts
    while (inputManager.getCurrentPrompt()) {
      const current = inputManager.getCurrentPrompt();
      if (current) {
        inputManager.resolvePrompt(current.id, null);
      }
    }
  });

  function TestRenderer({ prompt, queueLength, onSubmit, onCancel }: RendererProps<string>) {
    return (
      <div data-testid="test-renderer">
        <div data-testid="message">{prompt.message}</div>
        <div data-testid="queue-length">{queueLength}</div>
        <button data-testid="submit" onClick={() => onSubmit('test-value')}>
          Submit
        </button>
        <button data-testid="cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  }

  it('should render children when no prompt', () => {
    render(
      <InputProvider>
        <div data-testid="child">Child Content</div>
      </InputProvider>
    );

    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.queryByTestId('test-renderer')).toBeNull();
  });

  it('should render prompt when available', async () => {
    render(
      <InputProvider>
        <div data-testid="child">Child Content</div>
      </InputProvider>
    );

    // Trigger a prompt
    inputManager.input({ message: 'Test Message', kind: 'test' });

    await waitFor(() => {
      expect(screen.getByTestId('test-renderer')).toBeTruthy();
      expect(screen.getByTestId('message').textContent).toBe('Test Message');
      expect(screen.getByTestId('child')).toBeTruthy(); // Children still rendered
    });
  });

  it('should update queue length', async () => {
    render(
      <InputProvider>
        <div>Content</div>
      </InputProvider>
    );

    // Add multiple prompts
    inputManager.input({ message: 'First' });
    inputManager.input({ message: 'Second' });
    inputManager.input({ message: 'Third' });

    await waitFor(() => {
      expect(screen.getByTestId('queue-length').textContent).toBe('2');
    });
  });

  it('should handle submit', async () => {
    render(
      <InputProvider>
        <div>Content</div>
      </InputProvider>
    );

    const promise = inputManager.input({ message: 'Test' });

    await waitFor(() => {
      expect(screen.getByTestId('test-renderer')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('submit'));

    const result = await promise;
    expect(result).toBe('test-value');

    await waitFor(() => {
      expect(screen.queryByTestId('test-renderer')).toBeNull();
    });
  });

  it('should handle cancel', async () => {
    render(
      <InputProvider>
        <div>Content</div>
      </InputProvider>
    );

    const promise = inputManager.input({ message: 'Test' });

    await waitFor(() => {
      expect(screen.getByTestId('test-renderer')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('cancel'));

    const result = await promise;
    expect(result).toBeNull();

    await waitFor(() => {
      expect(screen.queryByTestId('test-renderer')).toBeNull();
    });
  });

  it('should handle missing renderer', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <InputProvider>
        <div data-testid="child">Content</div>
      </InputProvider>
    );

    const promise = inputManager.input({ message: 'Test', kind: 'missing' });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('No renderer for kind: missing');
      expect(screen.queryByTestId('test-renderer')).toBeNull();
      expect(screen.getByTestId('child')).toBeTruthy();
    });

    const result = await promise;
    expect(result).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should update when prompt changes', async () => {
    render(
      <InputProvider>
        <div>Content</div>
      </InputProvider>
    );

    const promise1 = inputManager.input({ message: 'First' });
    const promise2 = inputManager.input({ message: 'Second' });

    await waitFor(() => {
      expect(screen.getByTestId('message').textContent).toBe('First');
    });

    fireEvent.click(screen.getByTestId('submit'));
    await promise1;

    await waitFor(() => {
      expect(screen.getByTestId('message').textContent).toBe('Second');
    });

    fireEvent.click(screen.getByTestId('submit'));
    await promise2;

    await waitFor(() => {
      expect(screen.queryByTestId('test-renderer')).toBeNull();
    });
  });

  it('should cleanup subscription on unmount', async () => {
    // Get listener count before mounting
    const beforeMountCount = (inputManager as any).listeners.size;
    
    const { unmount } = render(
      <InputProvider>
        <div>Content</div>
      </InputProvider>
    );

    // Should have added one listener
    const afterMountCount = (inputManager as any).listeners.size;
    expect(afterMountCount).toBe(beforeMountCount + 1);

    unmount();

    // Should have removed the listener
    const afterUnmountCount = (inputManager as any).listeners.size;
    expect(afterUnmountCount).toBe(beforeMountCount);
  });

  it('should not re-subscribe on re-render', async () => {
    const Component = () => {
      const [count, setCount] = React.useState(0);
      return (
        <InputProvider>
          <button onClick={() => setCount(c => c + 1)} data-testid="rerender">
            Count: {count}
          </button>
        </InputProvider>
      );
    };

    render(<Component />);

    const initialListenerCount = (inputManager as any).listeners.size;

    // Trigger re-renders
    fireEvent.click(screen.getByTestId('rerender'));
    fireEvent.click(screen.getByTestId('rerender'));

    const finalListenerCount = (inputManager as any).listeners.size;
    expect(finalListenerCount).toBe(initialListenerCount);
  });

  it('should handle prompt with default renderer', async () => {
    render(
      <InputProvider>
        <div>Content</div>
      </InputProvider>
    );

    // Use default renderer (no kind specified)
    const promise = inputManager.input({ message: 'Default Test' });

    await waitFor(() => {
      expect(screen.getByTestId('test-renderer')).toBeTruthy();
      expect(screen.getByTestId('message').textContent).toBe('Default Test');
    });

    fireEvent.click(screen.getByTestId('submit'));
    const result = await promise;
    expect(result).toBe('test-value');
  });

  it('should handle submit callback changing with current prompt', async () => {
    render(
      <InputProvider>
        <div>Content</div>
      </InputProvider>
    );

    const promise1 = inputManager.input({ message: 'First' });

    await waitFor(() => {
      expect(screen.getByTestId('message').textContent).toBe('First');
    });

    // Click submit for first prompt
    fireEvent.click(screen.getByTestId('submit'));
    const result1 = await promise1;
    expect(result1).toBe('test-value');

    // Now test second prompt
    const promise2 = inputManager.input({ message: 'Second' });

    await waitFor(() => {
      expect(screen.getByTestId('message').textContent).toBe('Second');
    });

    fireEvent.click(screen.getByTestId('submit'));
    const result2 = await promise2;
    expect(result2).toBe('test-value');
  });
});