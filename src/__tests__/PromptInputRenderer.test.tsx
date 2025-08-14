import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { inputManager } from '../inputManager'
import { PromptInputRenderer } from '../PromptInputRenderer'
import type { InputConfig, RendererProps } from '../types'
import { screen, waitFor } from './test-utils'

describe('PromptInputRenderer', () => {
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
    const TestRenderer = ({ prompt, queueLength }: RendererProps<any>) => {
      return (
        <div data-testid={`test-renderer-${prompt.id}`}>
          <div data-testid={`message-${prompt.id}`}>{prompt.message}</div>
          <div data-testid={`queue-${prompt.id}`}>{queueLength}</div>
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

  it('should render nothing when no prompt', () => {
    render(<PromptInputRenderer />)
    expect(screen.queryByTestId(/test-renderer/)).toBeNull()
  })

  it('should render current prompt only by default', async () => {
    render(<PromptInputRenderer />)

    // Add multiple prompts
    void inputManager.input({ message: 'First' })
    void inputManager.input({ message: 'Second' })
    void inputManager.input({ message: 'Third' })

    await waitFor(() => screen.queryByTestId(/test-renderer/))

    // Should only render the current prompt (First)
    const renderers = screen.queryAllByTestId(/test-renderer/)
    expect(renderers.length).toBe(1)
    expect(screen.queryByTestId(/message-/)?.textContent).toBe('First')
  })

  it('should render all prompts when renderEntireQueue is true', async () => {
    render(<PromptInputRenderer renderEntireQueue={true} />)

    // Add multiple prompts
    void inputManager.input({ message: 'First' })
    void inputManager.input({ message: 'Second' })
    void inputManager.input({ message: 'Third' })

    await waitFor(() => screen.queryAllByTestId(/test-renderer/).length === 3)

    // Should render all prompts
    const renderers = screen.queryAllByTestId(/test-renderer/)
    expect(renderers.length).toBe(3)

    // Check messages are rendered
    const messages = screen.queryAllByTestId(/message-/).map((el: HTMLElement) => el.textContent)
    expect(messages).toEqual(['First', 'Second', 'Third'])
  })

  it('should update when prompts are resolved', async () => {
    render(<PromptInputRenderer />)

    void inputManager.input({ message: 'First' })
    void inputManager.input({ message: 'Second' })

    await waitFor(() => screen.queryByTestId(/message-/)?.textContent === 'First')

    // Resolve first prompt
    const current = inputManager.getCurrentPrompt()
    if (current) {
      inputManager.resolvePrompt(current.id, 'resolved')
    }

    // Should now show second prompt
    await waitFor(() => screen.queryByTestId(/message-/)?.textContent === 'Second')
    expect(screen.queryByTestId(/message-/)?.textContent).toBe('Second')
  })

  it('should show queue length correctly', async () => {
    render(<PromptInputRenderer />)

    // Add multiple prompts
    void inputManager.input({ message: 'First' })
    void inputManager.input({ message: 'Second' })
    void inputManager.input({ message: 'Third' })

    await waitFor(() => screen.queryByTestId(/queue-/))

    // Queue length should be 2 (Second and Third are queued)
    expect(screen.queryByTestId(/queue-/)?.textContent).toBe('2')
  })

  it('should apply opacity to inactive prompts in queue mode', async () => {
    const { container } = render(<PromptInputRenderer renderEntireQueue={true} />)

    void inputManager.input({ message: 'First' })
    void inputManager.input({ message: 'Second' })

    await waitFor(() => screen.queryAllByTestId(/test-renderer/).length === 2)

    // Check that first prompt has opacity 1 and second has 0.5
    const divs = container.querySelectorAll('div[style]')
    const firstDiv = divs[0] as HTMLElement
    const secondDiv = divs[1] as HTMLElement

    expect(firstDiv.style.opacity).toBe('1')
    expect(secondDiv.style.opacity).toBe('0.5')
  })

  it('should handle empty queue gracefully', () => {
    render(<PromptInputRenderer renderEntireQueue={true} />)
    expect(screen.queryByTestId(/test-renderer/)).toBeNull()
  })

  it('should unsubscribe on unmount', () => {
    // @ts-ignore - accessing private property for testing
    const beforeMountCount = (inputManager as unknown as { listeners: Set<unknown> }).listeners.size

    const { unmount } = render(<PromptInputRenderer />)

    // @ts-ignore - accessing private property for testing
    const afterMountCount = (inputManager as unknown as { listeners: Set<unknown> }).listeners.size
    expect(afterMountCount).toBe(beforeMountCount + 1)

    unmount()

    // @ts-ignore - accessing private property for testing
    const afterUnmountCount = (inputManager as unknown as { listeners: Set<unknown> }).listeners
      .size
    expect(afterUnmountCount).toBe(beforeMountCount)
  })
})
