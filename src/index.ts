// Main library exports

export { input } from './helpers' // Export enhanced input with convenience methods
export { InputProvider } from './InputProvider'
export { display, initInput, inputManager } from './inputManager'
export type { PromptInputRendererProps } from './PromptInputRenderer'
export { PromptInputRenderer } from './PromptInputRenderer'

// Re-export types
export type {
  BaseInputOptions,
  DisplayHandle,
  DisplayOptions,
  DisplayPrompt,
  InputConfig,
  InputEvents,
  InputOptions,
  InputPrompt,
  InputRenderer,
  InputRenderers,
  MissingRendererPolicy,
  RendererProps,
} from './types'
