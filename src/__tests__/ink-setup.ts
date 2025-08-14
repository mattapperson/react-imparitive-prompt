// Setup for Ink tests - mocks stdin methods required by ink-text-input

import { mock } from 'bun:test'
import { EventEmitter } from 'events'

// Create a mock stdin that extends EventEmitter
class MockStdin extends EventEmitter {
  ref = mock(() => this)
  unref = mock(() => this)
  setRawMode = mock(() => this)
  setEncoding = mock(() => this)
  pause = mock(() => this)
  resume = mock(() => this)
  read = mock(() => null)
  isTTY = true

  // Add pipe method
  pipe = mock((destination: any) => destination)
}

// Create and configure the mock stdin instance
const mockStdin = new MockStdin()

// Override process.stdin with our mock
Object.defineProperty(process, 'stdin', {
  value: mockStdin,
  writable: true,
  configurable: true,
})
