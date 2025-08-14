// Setup for Ink tests - mocks stdin methods required by ink-text-input

import { mock } from 'bun:test'

// Store the original stdin to avoid circular reference
const originalStdin = process.stdin
const patchedStdin = originalStdin as any

// Add missing methods that Ink expects
patchedStdin.ref = mock(() => patchedStdin)
patchedStdin.unref = mock(() => patchedStdin)
patchedStdin.setRawMode = mock(() => patchedStdin)
patchedStdin.setEncoding = mock(() => patchedStdin)
patchedStdin.pause = mock(() => patchedStdin)
patchedStdin.resume = mock(() => patchedStdin)
patchedStdin.read = mock(() => null)
patchedStdin.pipe = mock((destination: any) => destination)

// Set TTY flag
patchedStdin.isTTY = true

// Ensure listenerCount method exists (used by ink-text-input)
if (!patchedStdin.listenerCount) {
  patchedStdin.listenerCount = mock((_eventName: string) => 0)
}

// Ensure removeListener exists and returns this for chaining
if (!patchedStdin.removeListener) {
  patchedStdin.removeListener = mock(
    (_event: string, _listener: (...args: any[]) => any) => patchedStdin,
  )
}

// Ensure off exists (alias for removeListener)
if (!patchedStdin.off) {
  patchedStdin.off = patchedStdin.removeListener
}

// Replace process.stdin with our patched version
Object.defineProperty(process, 'stdin', {
  value: patchedStdin,
  writable: false,
  configurable: true,
})
