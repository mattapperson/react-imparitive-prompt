'use client'

import { InputProvider, initInput, webRenderers } from 'react-imperative-prompt'

// Initialize the input system
initInput({
  renderers: webRenderers,
  defaultRenderer: 'text',
})

export function Providers({ children }: { children: React.ReactNode }) {
  return <InputProvider>{children}</InputProvider>
}
