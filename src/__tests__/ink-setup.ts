// Setup for Ink tests - mocks stdin methods required by ink-text-input

// Use type assertion instead of interface extending to avoid conflicts
const stdin = process.stdin as NodeJS.ReadStream & {
  ref?: () => NodeJS.ReadStream
  unref?: () => NodeJS.ReadStream
  setRawMode?: (mode: boolean) => NodeJS.ReadStream
  isTTY?: boolean
  setEncoding?: (encoding: BufferEncoding) => NodeJS.ReadStream
}

// Create proper stdin mocks
if (!stdin.ref) {
  stdin.ref = () => process.stdin
}

if (!stdin.unref) {
  stdin.unref = () => process.stdin
}

if (!stdin.setRawMode) {
  stdin.setRawMode = () => process.stdin
}

if (!stdin.isTTY) {
  stdin.isTTY = true
}

// Mock setEncoding if not available
if (!stdin.setEncoding) {
  stdin.setEncoding = () => process.stdin
}
