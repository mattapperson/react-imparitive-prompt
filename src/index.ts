// Main library exports
export { initInput, inputManager } from "./inputManager";
export { input } from "./helpers"; // Export enhanced input with convenience methods
export { InputProvider } from "./InputProvider";

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
} from "./types";
