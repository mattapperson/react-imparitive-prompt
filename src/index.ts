// Main library exports

export { input } from './helpers' // Export enhanced input with convenience methods
export { InputProvider } from './InputProvider'
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
