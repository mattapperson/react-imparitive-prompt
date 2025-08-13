import type { RenderOptions } from '@testing-library/react'
import { act, render as rtlRender } from '@testing-library/react'
import type React from 'react'

// Custom render with better async handling
export function render(ui: React.ReactElement, options?: RenderOptions) {
  return rtlRender(ui, options)
}

// Wait helper that ensures React updates are flushed
export async function waitForPromises() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

// Better waitFor with retry logic
export async function waitForElement<T>(
  callback: () => T,
  options = { timeout: 3000, interval: 50 },
): Promise<T> {
  const startTime = Date.now()

  while (Date.now() - startTime < options.timeout) {
    try {
      const result = callback()
      if (result) return result
    } catch (_e) {
      // Continue waiting
    }
    await new Promise((resolve) => setTimeout(resolve, options.interval))
  }

  throw new Error('Timeout waiting for element')
}

// Flush all pending promises and timers
export async function flushAsyncOperations() {
  await act(async () => {
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

// Re-export commonly used utilities from @testing-library/react
const rtl = require('@testing-library/react')
export const screen = rtl.screen || {
  getByText: (text: string) => document.querySelector(`*:contains("${text}")`),
  getByRole: (role: string) => document.querySelector(`[role="${role}"]`),
  getByLabelText: (text: string) => document.querySelector(`[aria-label="${text}"]`),
  queryByText: (text: string) => document.querySelector(`*:contains("${text}")`),
}

export const fireEvent = rtl.fireEvent || {
  click: (element: Element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true })),
  change: (element: Element, options: { target: { value: string } }) => {
    const event = new Event('change', { bubbles: true })
    Object.defineProperty(event, 'target', {
      value: { value: options.target.value },
      enumerable: true,
    })
    element.dispatchEvent(event)
  },
  submit: (element: Element) => element.dispatchEvent(new Event('submit', { bubbles: true })),
}

export { act, cleanup } from '@testing-library/react'

// Custom waitFor implementation
export const waitFor = async <T,>(
  callback: () => T | Promise<T>,
  options = { timeout: 3000, interval: 50 },
): Promise<T> => {
  const startTime = Date.now()

  while (Date.now() - startTime < options.timeout) {
    try {
      const result = await callback()
      if (result !== undefined && result !== null && result !== false) {
        return result
      }
    } catch (_e) {
      // Continue waiting
    }
    await new Promise((resolve) => setTimeout(resolve, options.interval))
  }

  throw new Error('Timeout waiting for condition')
}
