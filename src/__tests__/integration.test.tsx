import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import React from 'react' // Used in JSX
import * as contextInputModule from '../context/input'
import { InputProvider } from '../InputProvider'
import * as indexModule from '../index'
import { initInput, input, inputManager } from '../inputManager'
import { PromptInputRenderer } from '../PromptInputRenderer'
import type { InputConfig } from '../types'
import { webRenderers } from '../web'
import { fireEvent, screen, waitFor } from './test-utils'

const jest = {
  fn: mock,
  spyOn,
}

describe('Integration Tests', () => {
  beforeEach(() => {
    cleanup()

    // Reset and initialize for each test
    const config: InputConfig = {
      renderers: webRenderers,
      defaultRenderer: 'default',
      onMissingRenderer: 'resolve-null',
    }
    initInput(config)
  })

  afterEach(() => {
    cleanup()
    // Clean up any pending prompts
    const current = inputManager.getCurrentPrompt()
    if (current) {
      inputManager.resolvePrompt(current.id, null)
    }
  })

  describe('Full flow with InputProvider', () => {
    it('should handle complete text input flow', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string | null>(null)

        const handleInput = React.useCallback(async () => {
          const value = await input<string>({
            message: 'What is your name?',
            kind: 'text',
            placeholder: 'Enter your name',
            required: true,
          })
          setResult(value)
        }, [])

        return (
          <div>
            <button type="button" onClick={handleInput} data-testid="trigger-text">
              Start Input
            </button>
            {result && <div data-testid="result">Hello, {result}!</div>}
          </div>
        )
      }

      render(
        <InputProvider>
          <TestApp />
          <PromptInputRenderer />
        </InputProvider>,
      )

      // Trigger input
      fireEvent.click(screen.getByTestId('trigger-text'))

      // Wait for modal to appear
      await waitFor(() => screen.queryByText('What is your name?'))

      // Find input and enter value
      const textInput = screen.getByRole('textbox') as HTMLInputElement
      expect(textInput.placeholder).toBe('Enter your name')
      fireEvent.change(textInput, { target: { value: 'John Doe' } })

      // Submit
      fireEvent.click(screen.getByText('Submit'))

      // Check result
      await waitFor(() => {
        const el = screen.queryByTestId('result')
        return el && el.textContent === 'Hello, John Doe!' ? el : null
      })
    })

    it('should handle multiple sequential inputs', async () => {
      const TestApp = () => {
        const [data, setData] = React.useState<{
          name: string | null
          email: string | null
          age: number | null
        } | null>(null)

        const handleMultiInput = React.useCallback(async () => {
          const name = await input<string>({
            message: 'Enter your name',
            kind: 'text',
            required: true,
          })

          const email = await input<string>({
            message: 'Enter your email',
            kind: 'email',
            required: true,
          })

          const age = await input<number>({
            message: 'Enter your age',
            kind: 'number',
            required: true,
          })

          setData({ name, email, age })
        }, [])

        return (
          <div>
            <button type="button" onClick={handleMultiInput} data-testid="trigger-multi">
              Start Multi Input
            </button>
            {data && (
              <div data-testid="result">
                {data.name}, {data.email}, {data.age}
              </div>
            )}
          </div>
        )
      }

      render(
        <InputProvider>
          <TestApp />
          <PromptInputRenderer />
        </InputProvider>,
      )

      fireEvent.click(screen.getByTestId('trigger-multi'))

      // First input - name
      await waitFor(() => screen.queryByText('Enter your name'))
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Jane' },
      })
      fireEvent.click(screen.getByText('Submit'))

      // Second input - email
      await waitFor(() => screen.queryByText('Enter your email'))
      const emailInput = screen.getByRole('textbox') as HTMLInputElement
      expect(emailInput.type).toBe('email')
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } })
      fireEvent.click(screen.getByText('Submit'))

      // Third input - age
      await waitFor(() => screen.queryByText('Enter your age'))
      const ageInput = document.getElementById('number-input')
      fireEvent.change(ageInput!, { target: { value: '25' } })
      fireEvent.click(screen.getByText('Submit'))

      // Check final result
      await waitFor(() => {
        const el = screen.queryByTestId('result')
        return el && el.textContent === 'Jane, jane@example.com, 25' ? el : null
      })
    })

    it('should handle cancellation', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string>('')

        const handleInput = React.useCallback(async () => {
          const value = await input<string>({
            message: 'Enter text',
            kind: 'text',
          })
          setResult(value === null ? 'Cancelled' : value)
        }, [])

        return (
          <div>
            <button type="button" onClick={handleInput} data-testid="trigger-cancel">
              Start Input
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        )
      }

      render(
        <InputProvider>
          <TestApp />
          <PromptInputRenderer />
        </InputProvider>,
      )

      fireEvent.click(screen.getByTestId('trigger-cancel'))

      await waitFor(() => screen.queryByText('Enter text'))

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'))

      await waitFor(() => {
        const el = screen.queryByTestId('result')
        return el && el.textContent === 'Cancelled' ? el : null
      })
    })

    it('should handle Promise.all with queue', async () => {
      const TestApp = () => {
        const [results, setResults] = React.useState<Array<string | number | null>>([])

        const handleBatch = React.useCallback(async () => {
          const [a, b, c] = await Promise.all([
            input<string>({ message: 'First', kind: 'text' }),
            input<string>({ message: 'Second', kind: 'text' }),
            input<string>({ message: 'Third', kind: 'text' }),
          ])
          setResults([a, b, c])
        }, [])

        return (
          <div>
            <button type="button" onClick={handleBatch} data-testid="trigger-batch">
              Start Batch
            </button>
            {results.length > 0 && <div data-testid="result">{results.join(', ')}</div>}
          </div>
        )
      }

      render(
        <InputProvider>
          <TestApp />
          <PromptInputRenderer />
        </InputProvider>,
      )

      fireEvent.click(screen.getByTestId('trigger-batch'))

      // First prompt - should show queue indicator
      await waitFor(() => screen.queryByText('First'))

      // Check for queue indicator in the modal
      const modal = screen.getByRole('dialog')
      expect(modal.textContent).toContain('2 more steps remaining')
      expect(screen.getByText('Next')).toBeTruthy()

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A' } })
      fireEvent.click(screen.getByText('Next'))

      // Second prompt
      await waitFor(() => screen.queryByText('Second'))

      const modal2 = screen.getByRole('dialog')
      expect(modal2.textContent).toContain('1 more step remaining')

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'B' } })
      fireEvent.click(screen.getByText('Next'))

      // Third prompt
      await waitFor(() => screen.queryByText('Third') && screen.queryByText('Submit'))

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'C' } })
      fireEvent.click(screen.getByText('Submit'))

      // Check results
      await waitFor(() => {
        const el = screen.queryByTestId('result')
        return el && el.textContent === 'A, B, C' ? el : null
      })
    })

    it('should handle timeout', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string>('')

        const handleInput = React.useCallback(async () => {
          const value = await input<string>({
            message: 'Quick input',
            kind: 'text',
            timeoutMs: 50,
          })
          setResult(value === null ? 'Timed out' : value)
        }, [])

        return (
          <div>
            <button type="button" onClick={handleInput} data-testid="trigger-timeout">
              Start Input
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        )
      }

      render(
        <InputProvider>
          <TestApp />
          <PromptInputRenderer />
        </InputProvider>,
      )

      fireEvent.click(screen.getByTestId('trigger-timeout'))

      await waitFor(() => screen.queryByText('Quick input'))

      // Wait for timeout to trigger
      await new Promise((resolve) => setTimeout(resolve, 100))

      await waitFor(() => {
        const el = screen.queryByTestId('result')
        return el && el.textContent === 'Timed out' ? el : null
      })
    })

    it('should handle abort signal', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string>('')
        const controllerRef = React.useRef<AbortController>()

        const handleInput = React.useCallback(async () => {
          controllerRef.current = new AbortController()
          const value = await input<string>({
            message: 'Abortable input',
            kind: 'text',
            abortSignal: controllerRef.current.signal,
          })
          setResult(value === null ? 'Aborted' : value)
        }, [])

        const handleAbort = React.useCallback(() => {
          controllerRef.current?.abort()
        }, [])

        return (
          <div>
            <button type="button" onClick={handleInput} data-testid="trigger-abort">
              Start Input
            </button>
            <button type="button" onClick={handleAbort} data-testid="abort">
              Abort
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        )
      }

      render(
        <InputProvider>
          <TestApp />
          <PromptInputRenderer />
        </InputProvider>,
      )

      fireEvent.click(screen.getByTestId('trigger-abort'))

      await waitFor(() => screen.queryByText('Abortable input'))

      // Abort the input
      fireEvent.click(screen.getByTestId('abort'))

      await waitFor(() => {
        const el = screen.queryByTestId('result')
        return el && el.textContent === 'Aborted' ? el : null
      })
    })

    it('should handle password input', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string>('')

        const handleInput = React.useCallback(async () => {
          const value = await input<string>({
            message: 'Enter password',
            kind: 'password',
            required: true,
          })
          setResult(value ? 'Password set' : 'No password')
        }, [])

        return (
          <div>
            <button type="button" onClick={handleInput} data-testid="trigger-password">
              Set Password
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        )
      }

      render(
        <InputProvider>
          <TestApp />
          <PromptInputRenderer />
        </InputProvider>,
      )

      fireEvent.click(screen.getByTestId('trigger-password'))

      await waitFor(() => screen.queryByText('Enter password'))

      const passwordInput = document.getElementById('text-input') as HTMLInputElement
      expect(passwordInput).toBeTruthy()
      expect(passwordInput.type).toBe('password')

      fireEvent.change(passwordInput, { target: { value: 'secret123' } })
      fireEvent.click(screen.getByText('Submit'))

      await waitFor(() => {
        const el = screen.queryByTestId('result')
        return el && el.textContent === 'Password set' ? el : null
      })
    })

    it('should handle number input with validation', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string>('')

        const handleInput = React.useCallback(async () => {
          const value = await input<number>({
            message: 'Enter your age',
            kind: 'number',
            placeholder: '18-100',
            required: true,
          })
          setResult(value !== null ? `Age: ${value}` : 'No age')
        }, [])

        return (
          <div>
            <button type="button" onClick={handleInput} data-testid="trigger-age">
              Enter Age
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        )
      }

      render(
        <InputProvider>
          <TestApp />
          <PromptInputRenderer />
        </InputProvider>,
      )

      fireEvent.click(screen.getByTestId('trigger-age'))

      await waitFor(() => screen.queryByText('Enter your age'))

      const numberInput = document.getElementById('number-input') as HTMLInputElement
      expect(numberInput).toBeTruthy()
      expect(numberInput.placeholder).toBe('18-100')

      fireEvent.change(numberInput, { target: { value: '25' } })
      fireEvent.click(screen.getByText('Submit'))

      await waitFor(() => {
        const el = screen.queryByTestId('result')
        return el && el.textContent === 'Age: 25' ? el : null
      })
    })
  })

  describe('Error handling', () => {
    it('should handle missing renderer gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const TestApp = () => {
        const [result, setResult] = React.useState<string>('')

        const handleInput = React.useCallback(async () => {
          const value = await input<string>({
            message: 'Test',
            kind: 'nonexistent',
          })
          setResult(value === null ? 'Handled missing renderer' : value)
        }, [])

        return (
          <div>
            <button type="button" onClick={handleInput} data-testid="trigger-missing">
              Trigger
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        )
      }

      render(
        <InputProvider>
          <TestApp />
          <PromptInputRenderer />
        </InputProvider>,
      )

      fireEvent.click(screen.getByTestId('trigger-missing'))

      await waitFor(() => {
        const el = screen.queryByTestId('result')
        return el && el.textContent === 'Handled missing renderer' ? el : null
      })

      expect(consoleSpy).toHaveBeenCalledWith('No renderer for kind: nonexistent')
      consoleSpy.mockRestore()
    })
  })

  describe('context/input re-exports', () => {
    it('should export all necessary functions and types from context/input', () => {
      // Use the imported module
      expect(typeof contextInputModule.input).toBe('function')
      expect(typeof contextInputModule.initInput).toBe('function')
      expect(contextInputModule.inputManager).toBe(inputManager)

      // They should be the exact same objects (singleton)
      expect(contextInputModule.input).toBe(input)
      expect(contextInputModule.initInput).toBe(initInput)
    })
  })

  describe('index exports', () => {
    it('should export all public API from index', () => {
      expect(typeof indexModule.input).toBe('function')
      expect(typeof indexModule.initInput).toBe('function')
      expect(indexModule.inputManager).toBeTruthy()
      expect(indexModule.InputProvider).toBeTruthy()
      // webRenderers are exported from the main module
      expect(webRenderers).toBeTruthy()
    })
  })
})
