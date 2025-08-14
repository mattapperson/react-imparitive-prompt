'use client'

import { InputProvider, initInput } from 'react-imperative-prompt'
import { webRenderers } from 'react-imperative-prompt/web'

// Initialize the input system
initInput({
  renderers: webRenderers,
  defaultRenderer: 'text',
})

export function Providers({ children }: { children: React.ReactNode }) {
  return <InputProvider>{children}</InputProvider>
}
