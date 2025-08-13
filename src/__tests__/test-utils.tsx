import React from 'react';
import { render as rtlRender, waitFor, act } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';

// Custom render with better async handling
export function render(ui: React.ReactElement, options?: RenderOptions) {
  return rtlRender(ui, options);
}

// Wait helper that ensures React updates are flushed
export async function waitForPromises() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

// Better waitFor with retry logic
export async function waitForElement(
  callback: () => any,
  options = { timeout: 3000, interval: 50 }
) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < options.timeout) {
    try {
      const result = callback();
      if (result) return result;
    } catch (e) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, options.interval));
  }
  
  throw new Error('Timeout waiting for element');
}

// Flush all pending promises and timers
export async function flushAsyncOperations() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

export * from '@testing-library/react';
export { waitFor, act } from '@testing-library/react';