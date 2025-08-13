// Separate entry point for Ink renderers
// Use this when building CLI applications with Ink
// Example: import { inkRenderers } from 'react-imperative-prompt/ink';

export { inkRenderers, TextInputPrompt, NumberInputPrompt } from './inkRenderer';
export { input, initInput, inputManager } from './inputManager';
export { InputProvider } from './InputProvider';

// Re-export types
export type {
  InputOptions,
  InputConfig,
  InputRenderer,
  RendererProps,
  InputPrompt,
  InputEvents,
  InputRenderers,
  MissingRendererPolicy,
  BaseInputOptions,
} from './types';