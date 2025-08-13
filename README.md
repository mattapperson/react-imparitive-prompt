# React Imperative Prompt

A platform-agnostic imperative prompt system for React applications. This library allows you to call modal prompts imperatively using promises, similar to browser's `window.prompt()` but with full React component customization.

## Features

- 🎯 **Imperative API** - Call prompts using async/await syntax
- 🎨 **Fully Customizable** - Create your own renderers for any input type
- 📦 **Queue Management** - Automatic queueing of multiple prompts
- ⏱️ **Timeout Support** - Built-in timeout handling
- 🚫 **Cancellation** - AbortSignal support for prompt cancellation
- 🔧 **TypeScript** - Full type safety and inference
- 🌐 **Platform Agnostic** - Works on web, mobile, and other platforms

## Installation

```bash
npm install react-imperative-prompt
# or
yarn add react-imperative-prompt
# or
pnpm add react-imperative-prompt
```

## Quick Start

```tsx
import { InputProvider, input, initInput, webRenderers } from 'react-imperative-prompt';

// Initialize once at app startup
initInput({
  renderers: webRenderers,
  defaultRenderer: 'default',
});

// Wrap your app with InputProvider
function App() {
  return (
    <InputProvider>
      <YourApp />
    </InputProvider>
  );
}

// Use anywhere in your app
async function handleUserInput() {
  const name = await input<string>({
    message: 'What is your name?',
    kind: 'text',
    required: true,
  });
  
  console.log('User entered:', name);
}
```

## API Reference

### `initInput(config)`

Initialize the input system with your configuration.

```typescript
initInput({
  renderers: InputRenderers,
  defaultRenderer: string,
  onMissingRenderer?: 'resolve-null' | 'reject' | 'throw',
});
```

### `input<T>(options)`

Show a prompt and wait for user input.

```typescript
const result = await input<string>({
  message: string,              // The prompt message
  kind?: string,                // Renderer type to use
  defaultValue?: T,             // Default value
  placeholder?: string,         // Placeholder text
  required?: boolean,           // Whether input is required
  timeoutMs?: number,           // Timeout in milliseconds
  abortSignal?: AbortSignal,    // For cancellation
  meta?: Record<string, unknown>, // Custom metadata for renderers
});
```

### `InputProvider`

React component that renders the current prompt.

```tsx
<InputProvider>
  {children}
</InputProvider>
```

## Creating Custom Renderers

```tsx
import type { RendererProps } from 'react-imperative-prompt';

function CustomRenderer({ prompt, queueLength, onSubmit, onCancel }: RendererProps<CustomType>) {
  // Your custom UI implementation
  return (
    <div>
      <h2>{prompt.message}</h2>
      {/* Your input UI */}
      <button onClick={() => onSubmit(value)}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}

// Register your renderer
initInput({
  renderers: {
    ...webRenderers,
    custom: CustomRenderer,
  },
  defaultRenderer: 'default',
});

// Use it
const result = await input<CustomType>({
  message: 'Custom prompt',
  kind: 'custom',
});
```

## License

MIT