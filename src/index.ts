// Main library exports
export { input, initInput, inputManager } from './inputManager';
export { InputProvider } from './InputProvider';
export { webRenderers, TextInputModal, NumberInputModal } from './webRenderers';

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