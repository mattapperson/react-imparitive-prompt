// Setup for Ink tests - mocks stdin methods required by ink-text-input

// Create proper stdin mocks
if (!process.stdin.ref) {
  (process.stdin as any).ref = () => process.stdin;
}

if (!process.stdin.unref) {
  (process.stdin as any).unref = () => process.stdin;
}

if (!process.stdin.setRawMode) {
  (process.stdin as any).setRawMode = () => process.stdin;
}

if (!process.stdin.isTTY) {
  (process.stdin as any).isTTY = true;
}

// Mock setEncoding if not available
if (!process.stdin.setEncoding) {
  (process.stdin as any).setEncoding = () => process.stdin;
}