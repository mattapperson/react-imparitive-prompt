import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';

const jest = {
  fn: mock,
  spyOn,
  useFakeTimers: () => {},
  useRealTimers: () => {},
  advanceTimersByTime: (ms: number) => {},
};
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { InputProvider, webRenderers } from '../index';
import { input, initInput, inputManager } from '../inputManager';
import type { InputConfig } from '../types';

describe('Integration Tests', () => {
  beforeEach(() => {
    cleanup();
    // Reset and initialize for each test
    const config: InputConfig = {
      renderers: webRenderers,
      defaultRenderer: 'default',
      onMissingRenderer: 'resolve-null',
    };
    initInput(config);
  });

  afterEach(() => {
    cleanup();
    // Clean up any pending prompts
    const current = inputManager.getCurrentPrompt();
    if (current) {
      inputManager.resolvePrompt(current.id, null);
    }
  });

  describe('Full flow with InputProvider', () => {
    it('should handle complete text input flow', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string | null>(null);

        const handleInput = async () => {
          const value = await input<string>({
            message: 'What is your name?',
            kind: 'text',
            placeholder: 'Enter your name',
            required: true,
          });
          setResult(value);
        };

        return (
          <div>
            <button onClick={handleInput} data-testid="trigger-text">
              Start Input
            </button>
            {result && <div data-testid="result">Hello, {result}!</div>}
          </div>
        );
      };

      render(
        <InputProvider>
          <TestApp />
        </InputProvider>
      );

      // Trigger input
      fireEvent.click(screen.getByTestId('trigger'));

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('What is your name?')).toBeTruthy();
      });

      // Find input and enter value
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.placeholder).toBe('Enter your name');
      fireEvent.change(input, { target: { value: 'John Doe' } });

      // Submit
      fireEvent.click(screen.getByText('Submit'));

      // Check result
      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('Hello, John Doe!');
      });
    });

    it('should handle multiple sequential inputs', async () => {
      const TestApp = () => {
        const [data, setData] = React.useState<any>(null);

        const handleMultiInput = async () => {
          const name = await input<string>({
            message: 'Enter your name',
            kind: 'text',
            required: true,
          });

          const email = await input<string>({
            message: 'Enter your email',
            kind: 'email',
            required: true,
          });

          const age = await input<number>({
            message: 'Enter your age',
            kind: 'number',
            required: true,
          });

          setData({ name, email, age });
        };

        return (
          <div>
            <button onClick={handleMultiInput} data-testid="trigger-unique">
              Start Multi Input
            </button>
            {data && (
              <div data-testid="result">
                {data.name}, {data.email}, {data.age}
              </div>
            )}
          </div>
        );
      };

      render(
        <InputProvider>
          <TestApp />
        </InputProvider>
      );

      fireEvent.click(screen.getByTestId('trigger'));

      // First input - name
      await waitFor(() => {
        expect(screen.getByText('Enter your name')).toBeTruthy();
      });
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Jane' } });
      fireEvent.click(screen.getByText('Submit'));

      // Second input - email
      await waitFor(() => {
        expect(screen.getByText('Enter your email')).toBeTruthy();
      });
      const emailInput = screen.getByRole('textbox') as HTMLInputElement;
      expect(emailInput.type).toBe('email');
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
      fireEvent.click(screen.getByText('Submit'));

      // Third input - age
      await waitFor(() => {
        expect(screen.getByText('Enter your age')).toBeTruthy();
      });
      const ageInput = document.getElementById('number-input');
      fireEvent.change(ageInput!, { target: { value: '25' } });
      fireEvent.click(screen.getByText('Submit'));

      // Check final result
      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('Jane, jane@example.com, 25');
      });
    });

    it('should handle cancellation', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string>('');

        const handleInput = async () => {
          const value = await input<string>({
            message: 'Enter text',
            kind: 'text',
          });
          setResult(value === null ? 'Cancelled' : value);
        };

        return (
          <div>
            <button onClick={handleInput} data-testid="trigger-unique">
              Start Input
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        );
      };

      render(
        <InputProvider>
          <TestApp />
        </InputProvider>
      );

      fireEvent.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Enter text')).toBeTruthy();
      });

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('Cancelled');
      });
    });

    it('should handle Promise.all with queue', async () => {
      const TestApp = () => {
        const [results, setResults] = React.useState<any[]>([]);

        const handleBatch = async () => {
          const [a, b, c] = await Promise.all([
            input<string>({ message: 'First', kind: 'text' }),
            input<string>({ message: 'Second', kind: 'text' }),
            input<string>({ message: 'Third', kind: 'text' }),
          ]);
          setResults([a, b, c]);
        };

        return (
          <div>
            <button onClick={handleBatch} data-testid="trigger-unique">
              Start Batch
            </button>
            {results.length > 0 && (
              <div data-testid="result">{results.join(', ')}</div>
            )}
          </div>
        );
      };

      render(
        <InputProvider>
          <TestApp />
        </InputProvider>
      );

      fireEvent.click(screen.getByTestId('trigger'));

      // First prompt with queue indicator
      await waitFor(() => {
        expect(screen.getByText('First')).toBeTruthy();
        expect(screen.getByText('2 more steps remaining')).toBeTruthy();
        expect(screen.getByText('Next')).toBeTruthy();
      });

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A' } });
      fireEvent.click(screen.getByText('Next'));

      // Second prompt
      await waitFor(() => {
        expect(screen.getByText('Second')).toBeTruthy();
        expect(screen.getByText('1 more step remaining')).toBeTruthy();
      });

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'B' } });
      fireEvent.click(screen.getByText('Next'));

      // Third prompt
      await waitFor(() => {
        expect(screen.getByText('Third')).toBeTruthy();
        expect(screen.queryByText(/more step/)).toBeNull();
        expect(screen.getByText('Submit')).toBeTruthy();
      });

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'C' } });
      fireEvent.click(screen.getByText('Submit'));

      // Check results
      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('A, B, C');
      });
    });

    it('should handle timeout', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string>('');

        const handleInput = async () => {
          const value = await input<string>({
            message: 'Quick input',
            kind: 'text',
            timeoutMs: 50,
          });
          setResult(value === null ? 'Timed out' : value);
        };

        return (
          <div>
            <button onClick={handleInput} data-testid="trigger-timeout">
              Start Input
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        );
      };

      render(
        <InputProvider>
          <TestApp />
        </InputProvider>
      );

      fireEvent.click(screen.getByTestId('trigger-timeout'));

      await waitFor(() => {
        expect(screen.getByText('Quick input')).toBeTruthy();
      });

      // Wait for timeout to trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('Timed out');
      });
    });

    it('should handle abort signal', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string>('');
        const controllerRef = React.useRef<AbortController>();

        const handleInput = async () => {
          controllerRef.current = new AbortController();
          const value = await input<string>({
            message: 'Abortable input',
            kind: 'text',
            abortSignal: controllerRef.current.signal,
          });
          setResult(value === null ? 'Aborted' : value);
        };

        const handleAbort = () => {
          controllerRef.current?.abort();
        };

        return (
          <div>
            <button onClick={handleInput} data-testid="trigger-unique">
              Start Input
            </button>
            <button onClick={handleAbort} data-testid="abort">
              Abort
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        );
      };

      render(
        <InputProvider>
          <TestApp />
        </InputProvider>
      );

      fireEvent.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Abortable input')).toBeTruthy();
      });

      // Abort the input
      fireEvent.click(screen.getByTestId('abort'));

      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('Aborted');
      });
    });

    it('should handle password input', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string>('');

        const handleInput = async () => {
          const value = await input<string>({
            message: 'Enter password',
            kind: 'password',
            required: true,
          });
          setResult(value ? 'Password set' : 'No password');
        };

        return (
          <div>
            <button onClick={handleInput} data-testid="trigger-unique">
              Set Password
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        );
      };

      render(
        <InputProvider>
          <TestApp />
        </InputProvider>
      );

      fireEvent.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Enter password')).toBeTruthy();
      });

      const input = document.getElementById('text-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('password');
      
      fireEvent.change(input, { target: { value: 'secret123' } });
      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('Password set');
      });
    });

    it('should handle number input with validation', async () => {
      const TestApp = () => {
        const [result, setResult] = React.useState<string>('');

        const handleInput = async () => {
          const value = await input<number>({
            message: 'Enter your age',
            kind: 'number',
            placeholder: '18-100',
            required: true,
          });
          setResult(value !== null ? `Age: ${value}` : 'No age');
        };

        return (
          <div>
            <button onClick={handleInput} data-testid="trigger-unique">
              Enter Age
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        );
      };

      render(
        <InputProvider>
          <TestApp />
        </InputProvider>
      );

      fireEvent.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByText('Enter your age')).toBeTruthy();
      });

      const input = document.getElementById('number-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.placeholder).toBe('18-100');
      
      fireEvent.change(input, { target: { value: '25' } });
      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('Age: 25');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle missing renderer gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const TestApp = () => {
        const [result, setResult] = React.useState<string>('');

        const handleInput = async () => {
          const value = await input<string>({
            message: 'Test',
            kind: 'nonexistent',
          });
          setResult(value === null ? 'Handled missing renderer' : value);
        };

        return (
          <div>
            <button onClick={handleInput} data-testid="trigger-unique">
              Trigger
            </button>
            {result && <div data-testid="result">{result}</div>}
          </div>
        );
      };

      render(
        <InputProvider>
          <TestApp />
        </InputProvider>
      );

      fireEvent.click(screen.getByTestId('trigger'));

      await waitFor(() => {
        expect(screen.getByTestId('result').textContent).toBe('Handled missing renderer');
      });

      expect(consoleSpy).toHaveBeenCalledWith('No renderer for kind: nonexistent');
      consoleSpy.mockRestore();
    });
  });

  describe('context/input re-exports', () => {
    it('should export all necessary functions and types from context/input', async () => {
      // This is imported from context/input.ts
      const { input: contextInput, initInput: contextInitInput, inputManager: contextManager } = 
        await import('../context/input');

      expect(typeof contextInput).toBe('function');
      expect(typeof contextInitInput).toBe('function');
      expect(contextManager).toBe(inputManager);

      // Test that they work the same
      const config: InputConfig = {
        renderers: { test: () => null as any },
        defaultRenderer: 'test',
      };
      contextInitInput(config);

      // Should be initialized through the singleton
      expect(() => contextInput({ message: 'test' })).not.toThrow();
    });
  });

  describe('index exports', () => {
    it('should export all public API from index', () => {
      // All these are imported from index.ts at the top
      expect(typeof input).toBe('function');
      expect(typeof initInput).toBe('function');
      expect(inputManager).toBeTruthy();
      expect(InputProvider).toBeTruthy();
      expect(webRenderers).toBeTruthy();
    });
  });
});