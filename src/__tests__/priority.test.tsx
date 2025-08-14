import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { InputProvider } from '../InputProvider'
import { display, input, inputManager } from '../inputManager'
import { PromptInputRenderer } from '../PromptInputRenderer'
import type { InputConfig, RendererProps } from '../types'
import { screen, waitFor } from './test-utils'

describe('Priority Queue Tests', () => {
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
    const TestRenderer = ({ prompt }: RendererProps<any>) => {
      return (
        <div data-testid={`test-renderer-${prompt.id}`}>
          <div data-testid={`message-${prompt.id}`}>{prompt.message}</div>
          <div data-testid={`priority-${prompt.id}`}>{prompt.priority ?? 0}</div>
          <div data-testid={`type-${prompt.id}`}>
            {'type' in prompt && prompt.type === 'display' ? 'display' : 'input'}
          </div>
        </div>
      )
    }

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
  })

  it('should prioritize awaiting inputs over display when prioritizeAwaitingInputs is true', async () => {
    render(
      <InputProvider>
        <PromptInputRenderer prioritizeAwaitingInputs={true} />
      </InputProvider>,
    )

    // Start a display prompt
    const displayHandle = display({
      message: 'Display message',
    })

    // Wait for display to appear
    await waitFor(() => screen.queryByText('Display message'))
    expect(screen.queryByText('Display message')).toBeTruthy()

    // Now add an awaiting input - it should take priority
    void input({
      message: 'High priority input',
    })

    // The high priority input should replace the display
    await waitFor(() => screen.queryByText('High priority input'))
    expect(screen.queryByText('High priority input')).toBeTruthy()
    expect(screen.queryByText('Display message')).toBeNull()

    // Resolve the input
    const current = inputManager.getCurrentPrompt()
    if (current) {
      inputManager.resolvePrompt(current.id, 'resolved')
    }

    // Display should come back
    await waitFor(() => screen.queryByText('Display message'))
    expect(screen.queryByText('Display message')).toBeTruthy()

    // Clean up
    displayHandle.cancel()
  })

  it('should not prioritize when prioritizeAwaitingInputs is false', async () => {
    render(
      <InputProvider>
        <PromptInputRenderer prioritizeAwaitingInputs={false} />
      </InputProvider>,
    )

    // Start a display prompt
    const displayHandle = display({
      message: 'Display message',
    })

    // Wait for display to appear
    await waitFor(() => screen.queryByText('Display message'))
    expect(screen.queryByText('Display message')).toBeTruthy()

    // Add an awaiting input - it should NOT take priority
    void input({
      message: 'Normal priority input',
    })

    // Give it a moment to process
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Display should still be showing
    expect(screen.queryByText('Display message')).toBeTruthy()
    expect(screen.queryByText('Normal priority input')).toBeNull()

    // Clean up display
    displayHandle.cancel()

    // Now the input should show
    await waitFor(() => screen.queryByText('Normal priority input'))
    expect(screen.queryByText('Normal priority input')).toBeTruthy()

    // Resolve the input
    const current = inputManager.getCurrentPrompt()
    if (current) {
      inputManager.resolvePrompt(current.id, 'resolved')
    }
  })

  it('should respect custom priority values', async () => {
    render(
      <InputProvider>
        <PromptInputRenderer />
      </InputProvider>,
    )

    // Add multiple inputs with different priorities
    void input({
      message: 'Low priority',
      priority: 1,
    })

    void input({
      message: 'High priority',
      priority: 10,
    })

    void input({
      message: 'Medium priority',
      priority: 5,
    })

    // First input becomes current immediately, but after that priorities apply
    await waitFor(() => screen.queryByText('Low priority'))
    expect(screen.queryByText('Low priority')).toBeTruthy()

    // Resolve low priority
    let current = inputManager.getCurrentPrompt()
    if (current) {
      inputManager.resolvePrompt(current.id, 'resolved')
    }

    // Should show high priority next (highest in queue)
    await waitFor(() => screen.queryByText('High priority'))
    expect(screen.queryByText('High priority')).toBeTruthy()

    // Resolve high priority
    current = inputManager.getCurrentPrompt()
    if (current) {
      inputManager.resolvePrompt(current.id, 'resolved')
    }

    // Should show medium priority last
    await waitFor(() => screen.queryByText('Medium priority'))
    expect(screen.queryByText('Medium priority')).toBeTruthy()

    // Resolve medium priority
    current = inputManager.getCurrentPrompt()
    if (current) {
      inputManager.resolvePrompt(current.id, 'resolved')
    }
  })

  it('should handle queue insertion based on priority', async () => {
    render(
      <InputProvider>
        <PromptInputRenderer renderEntireQueue={true} />
      </InputProvider>,
    )

    // Add initial low priority items
    void input({
      message: 'First low',
      priority: 1,
    })

    void input({
      message: 'Second low',
      priority: 1,
    })

    await waitFor(() => screen.queryAllByTestId(/test-renderer/).length === 2)

    // Add a high priority item - it should jump to the front of the queue
    void input({
      message: 'High priority',
      priority: 10,
    })

    await waitFor(() => screen.queryAllByTestId(/test-renderer/).length === 3)

    // The first item is already current, so high priority goes to front of queue (position 1)
    const messages = screen.queryAllByTestId(/message-/).map((el: HTMLElement) => el.textContent)
    expect(messages[0]).toBe('First low') // Current stays current
    expect(messages[1]).toBe('High priority') // High priority at front of queue
    expect(messages[2]).toBe('Second low')

    // Clean up
    while (inputManager.getCurrentPrompt()) {
      const current = inputManager.getCurrentPrompt()
      if (current) {
        inputManager.resolvePrompt(current.id, null)
      }
    }
  })

  it('should suspend and restore display prompts correctly', async () => {
    render(
      <InputProvider>
        <PromptInputRenderer prioritizeAwaitingInputs={true} />
      </InputProvider>,
    )

    // Start a display prompt
    const displayHandle = display({
      message: 'Display to suspend',
      priority: 0, // Low priority
    })

    await waitFor(() => screen.queryByText('Display to suspend'))
    expect(screen.queryByText('Display to suspend')).toBeTruthy()

    // Add multiple high priority inputs
    void input({
      message: 'First high priority',
      priority: 10,
    })

    void input({
      message: 'Second high priority',
      priority: 10,
    })

    // First high priority should show, display should be suspended
    await waitFor(() => screen.queryByText('First high priority'))
    expect(screen.queryByText('First high priority')).toBeTruthy()
    expect(screen.queryByText('Display to suspend')).toBeNull()

    // Resolve first input
    let current = inputManager.getCurrentPrompt()
    if (current) {
      inputManager.resolvePrompt(current.id, 'resolved')
    }

    // Second high priority should show
    await waitFor(() => screen.queryByText('Second high priority'))
    expect(screen.queryByText('Second high priority')).toBeTruthy()
    expect(screen.queryByText('Display to suspend')).toBeNull()

    // Resolve second input
    current = inputManager.getCurrentPrompt()
    if (current) {
      inputManager.resolvePrompt(current.id, 'resolved')
    }

    // Display should be restored
    await waitFor(() => screen.queryByText('Display to suspend'))
    expect(screen.queryByText('Display to suspend')).toBeTruthy()

    // Clean up
    displayHandle.cancel()
  })
})
