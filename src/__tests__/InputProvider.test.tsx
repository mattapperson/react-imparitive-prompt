import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'

const jest = {
  fn: mock,
  spyOn,
}

import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { InputProvider } from '../InputProvider'
import { PromptInputRenderer } from '../PromptInputRenderer'
import { inputManager } from '../inputManager'
import type { InputConfig, RendererProps } from '../types'
import { fireEvent, screen, waitFor } from './test-utils'

describe('InputProvider', () => {
  beforeEach(() => {
    cleanup()
    // Clear any existing state from inputManager
    while (inputManager.getCurrentPrompt()) {
      const current = inputManager.getCurrentPrompt()
      if (current) {
        inputManager.resolvePrompt(current.id, null)
      }
    }
    // Clear the queue
    while (inputManager.getQueueLength() > 0) {
      const current = inputManager.getCurrentPrompt()
      if (!current && inputManager.getQueueLength() > 0) {
        // Force process the queue
        // @ts-ignore - accessing private method for testing
        ;(inputManager as unknown as { processQueue: () => void }).processQueue()
      }
      if (current) {
        inputManager.resolvePrompt(current.id, null)
      }
    }

    // Initialize with a test renderer
    const config: InputConfig = {
      renderers: {
        default: TestRenderer,
        test: TestRenderer,
      },
      defaultRenderer: 'default',
    }
    inputManager.init(config)
  })

  afterEach(() => {
    cleanup()
    // Clean up any pending prompts
    while (inputManager.getCurrentPrompt()) {
      const current = inputManager.getCurrentPrompt()
      if (current) {
        inputManager.resolvePrompt(current.id, null)
      }
    }
  })

  function TestRenderer({ prompt, queueLength, onSubmit, onCancel }: RendererProps<string>) {
    return (
      <div data-testid="test-renderer">
        <div data-testid="message">{prompt.message}</div>
        <div data-testid="queue-length">{queueLength}</div>
        <button type="button" data-testid="submit" onClick={() => onSubmit('test-value')}>
          Submit
        </button>
        <button type="button" data-testid="cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    )
  }

  it('should render children when no prompt', () => {
    render(
      <InputProvider>
        <div data-testid="child">Child Content</div>
        <PromptInputRenderer />
      </InputProvider>,
    )

    expect(screen.getByTestId('child')).toBeTruthy()
    expect(screen.queryByTestId('test-renderer')).toBeNull()
  })

  it('should render prompt when available', async () => {
    render(
      <InputProvider>
        <div data-testid="child">Child Content</div>
        <PromptInputRenderer />
      </InputProvider>,
    )

    // Trigger a prompt
    inputManager.input({ message: 'Test Message', kind: 'test' })

    await waitFor(() => screen.queryByTestId('test-renderer'))

    expect(screen.getByTestId('test-renderer')).toBeTruthy()
    expect(screen.getByTestId('message').textContent).toBe('Test Message')
    expect(screen.getByTestId('child')).toBeTruthy() // Children still rendered
  })

  it('should update queue length', async () => {
    render(
      <InputProvider>
        <div>Content</div>
        <PromptInputRenderer />
      </InputProvider>,
    )

    // Add multiple prompts
    inputManager.input({ message: 'First' })
    inputManager.input({ message: 'Second' })
    inputManager.input({ message: 'Third' })

    await waitFor(() => screen.queryByTestId('queue-length'))

    expect(screen.getByTestId('queue-length').textContent).toBe('2')
  })

  it('should handle submit', async () => {
    render(
      <InputProvider>
        <div>Content</div>
        <PromptInputRenderer />
      </InputProvider>,
    )

    const promise = inputManager.input({ message: 'Test' })

    await waitFor(() => screen.queryByTestId('test-renderer'))

    fireEvent.click(screen.getByTestId('submit'))

    const result = await promise
    expect(result).toBe('test-value')

    await waitFor(() => !screen.queryByTestId('test-renderer'))

    expect(screen.queryByTestId('test-renderer')).toBeNull()
  })

  it('should handle cancel', async () => {
    render(
      <InputProvider>
        <div>Content</div>
        <PromptInputRenderer />
      </InputProvider>,
    )

    const promise = inputManager.input({ message: 'Test' })

    await waitFor(() => screen.queryByTestId('test-renderer'))

    fireEvent.click(screen.getByTestId('cancel'))

    const result = await promise
    expect(result).toBeNull()

    await waitFor(() => !screen.queryByTestId('test-renderer'))

    expect(screen.queryByTestId('test-renderer')).toBeNull()
  })

  it('should handle missing renderer', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <InputProvider>
        <div data-testid="child">Content</div>
        <PromptInputRenderer />
      </InputProvider>,
    )

    const promise = inputManager.input({ message: 'Test', kind: 'missing' })

    // Wait a moment for the component to process
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(consoleSpy).toHaveBeenCalledWith('No renderer for kind: missing')
    expect(screen.queryByTestId('test-renderer')).toBeNull()
    expect(screen.getByTestId('child')).toBeTruthy()

    const result = await promise
    expect(result).toBeNull()

    consoleSpy.mockRestore()
  })

  it('should update when prompt changes', async () => {
    render(
      <InputProvider>
        <div>Content</div>
        <PromptInputRenderer />
      </InputProvider>,
    )

    const promise1 = inputManager.input({ message: 'First' })
    const promise2 = inputManager.input({ message: 'Second' })

    await waitFor(() => screen.queryByTestId('message'))
    expect(screen.getByTestId('message').textContent).toBe('First')

    fireEvent.click(screen.getByTestId('submit'))
    await promise1

    await waitFor(() => {
      const msg = screen.queryByTestId('message')
      return msg && msg.textContent === 'Second' ? msg : null
    })
    expect(screen.getByTestId('message').textContent).toBe('Second')

    fireEvent.click(screen.getByTestId('submit'))
    await promise2

    await waitFor(() => !screen.queryByTestId('test-renderer'))

    expect(screen.queryByTestId('test-renderer')).toBeNull()
  })

  it('should cleanup subscription on unmount', async () => {
    // Get listener count before mounting
    // @ts-ignore - accessing private property for testing
    const beforeMountCount = (inputManager as unknown as { listeners: Set<unknown> }).listeners.size

    const { unmount } = render(
      <InputProvider>
        <div>Content</div>
        <PromptInputRenderer />
      </InputProvider>,
    )

    // Should have added one listener
    // @ts-ignore - accessing private property for testing
    const afterMountCount = (inputManager as unknown as { listeners: Set<unknown> }).listeners.size
    expect(afterMountCount).toBe(beforeMountCount + 1)

    unmount()

    // Should have removed the listener
    // @ts-ignore - accessing private property for testing
    const afterUnmountCount = (inputManager as unknown as { listeners: Set<unknown> }).listeners
      .size
    expect(afterUnmountCount).toBe(beforeMountCount)
  })

  it('should not re-subscribe on re-render', async () => {
    const Component = () => {
      const [count, setCount] = React.useState(0)
      return (
        <InputProvider>
          <button type="button" onClick={() => setCount((c) => c + 1)} data-testid="rerender">
            Count: {count}
          </button>
          <PromptInputRenderer />
        </InputProvider>
      )
    }

    render(<Component />)

    // @ts-ignore - accessing private property for testing
    const initialListenerCount = (inputManager as unknown as { listeners: Set<unknown> }).listeners
      .size

    // Trigger re-renders
    fireEvent.click(screen.getByTestId('rerender'))
    fireEvent.click(screen.getByTestId('rerender'))

    // @ts-ignore - accessing private property for testing
    const finalListenerCount = (inputManager as unknown as { listeners: Set<unknown> }).listeners
      .size
    expect(finalListenerCount).toBe(initialListenerCount)
  })

  it('should handle prompt with default renderer', async () => {
    render(
      <InputProvider>
        <div>Content</div>
        <PromptInputRenderer />
      </InputProvider>,
    )

    // Use default renderer (no kind specified)
    const promise = inputManager.input({ message: 'Default Test' })

    await waitFor(() => screen.queryByTestId('test-renderer'))

    expect(screen.getByTestId('test-renderer')).toBeTruthy()
    expect(screen.getByTestId('message').textContent).toBe('Default Test')

    fireEvent.click(screen.getByTestId('submit'))
    const result = await promise
    expect(result).toBe('test-value')
  })

  it('should handle submit callback changing with current prompt', async () => {
    render(
      <InputProvider>
        <div>Content</div>
        <PromptInputRenderer />
      </InputProvider>,
    )

    const promise1 = inputManager.input({ message: 'First' })

    await waitFor(() => screen.queryByTestId('message'))
    expect(screen.getByTestId('message').textContent).toBe('First')

    // Click submit for first prompt
    fireEvent.click(screen.getByTestId('submit'))
    const result1 = await promise1
    expect(result1).toBe('test-value')

    // Now test second prompt
    const promise2 = inputManager.input({ message: 'Second' })

    await waitFor(() => {
      const msg = screen.queryByTestId('message')
      return msg && msg.textContent === 'Second' ? msg : null
    })
    expect(screen.getByTestId('message').textContent).toBe('Second')

    fireEvent.click(screen.getByTestId('submit'))
    const result2 = await promise2
    expect(result2).toBe('test-value')
  })
})
