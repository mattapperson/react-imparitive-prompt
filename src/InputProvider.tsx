// InputProvider.tsx
import type React from 'react'

export function InputProvider({ children }: { children: React.ReactNode }) {
  // The provider now only acts as a container for the PromptInputRenderer components
  // All rendering logic has been moved to PromptInputRenderer
  return <>{children}</>
}
