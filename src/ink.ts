// Separate entry point for Ink renderers
// Use this when building CLI applications with Ink
// Example: import { inkRenderers } from 'react-imperative-prompt/ink';

export { input } from './helpers' // Export enhanced input with convenience methods
export { InputProvider } from './InputProvider'
export { inkRenderers, NumberInputPrompt, TextInputPrompt } from './inkRenderer'
export { initInput, inputManager } from './inputManager'

// Re-export types
export type {
  BaseInputOptions,
  InputConfig,
  InputEvents,
  InputOptions,
  InputPrompt,
  InputRenderer,
  InputRenderers,
  MissingRendererPolicy,
  RendererProps,
} from './types'
