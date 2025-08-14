# React Imperative Prompt

[![npm version](https://badge.fury.io/js/react-imperative-prompt.svg)](https://www.npmjs.com/package/react-imperative-prompt)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A platform-agnostic imperative prompt system for React applications. Call modal prompts imperatively using promises, similar to browser's `window.prompt()` but with full React component customization to use custom models or any other renderable content using an async API

## ✨ Features

- 🎯 **Imperative API** - Simple async/await syntax with convenience methods
- 🎨 **Fully Customizable** - Create your own renderers for any input type
- 📦 **Queue Management** - Automatic queueing of multiple prompts
- ⏱️ **Timeout Support** - Built-in timeout handling
- 🚫 **Cancellation** - AbortSignal support for prompt cancellation
- 🔧 **TypeScript** - Full type safety and inference
- 🌐 **Platform Agnostic** - Works on web, CLI, mobile, and other platforms
- 🎭 **Multiple Renderers** - Built-in support for web modals and Ink CLI

## 📦 Installation

```bash
npm install react-imperative-prompt
# or
yarn add react-imperative-prompt
# or
bun add react-imperative-prompt
```

## 🚀 Quick Start

### Web Application (Next.js, Vite, etc.)

```tsx
import { InputProvider, PromptInputRenderer, input, initInput, webRenderers } from 'react-imperative-prompt';

// Initialize once at app startup
initInput({
  renderers: webRenderers,
  defaultRenderer: 'text',
});

// Wrap your app with InputProvider and place PromptInputRenderer anywhere
function App() {
  return (
    <InputProvider>
      <YourApp />
      {/* Place the renderer anywhere in your app */}
      <PromptInputRenderer />
    </InputProvider>
  );
}

// Use anywhere in your app
async function handleUserInput() {
  const name = await input.text({
    message: 'What is your name?',
    defaultValue: 'John Doe',
  });
  
  const age = await input.number({
    message: 'How old are you?',
    min: 1,
    max: 120,
  });
  
  const subscribe = await input.confirm({
    message: 'Subscribe to newsletter?',
    defaultValue: true,
  });
  
  console.log({ name, age, subscribe });
}
```

### CLI Application (Ink)

```tsx
import { render } from 'ink';
import { InputProvider, input, initInput, inkRenderers } from 'react-imperative-prompt/ink';

// Initialize with Ink renderers
initInput({
  renderers: inkRenderers,
  defaultRenderer: 'text',
});

function App() {
  React.useEffect(() => {
    const runWizard = async () => {
      const name = await input.text({
        message: 'What is your name?',
      });
      
      const language = await input.select({
        message: 'Favorite language?',
        options: [
          { label: 'TypeScript', value: 'ts' },
          { label: 'JavaScript', value: 'js' },
          { label: 'Python', value: 'py' },
        ],
      });
      
      console.log(`Hello ${name}, you chose ${language}!`);
    };
    
    runWizard();
  }, []);
  
  return null;
}

render(
  <InputProvider>
    <App />
  </InputProvider>
);
```

## 📖 API Reference

### Core Functions

#### `initInput(config)`

Initialize the input system with your configuration. Must be called before using any input methods.

```typescript
initInput({
  renderers: InputRenderers,       // Map of renderer components
  defaultRenderer: string,         // Default renderer to use
  onMissingRenderer?: 'resolve-null' | 'reject' | 'throw', // Error handling
});
```

#### `InputProvider`

React context provider that manages the input system state. Must wrap your application.

```tsx
<InputProvider>
  {children}
</InputProvider>
```

#### `PromptInputRenderer`

React component that renders the current prompt. Can be placed anywhere within the InputProvider.

```tsx
<PromptInputRenderer 
  renderEntireQueue={false}  // Optional: render all queued prompts
/>
```

**Props:**
- `renderEntireQueue` (optional): When `true`, renders all queued prompts. When `false` (default), only renders the current active prompt.
- `prioritizeAwaitingInputs` (optional): When `true`, awaiting inputs (like `input.text()`) will take priority over display inputs, temporarily suspending displays to handle user inputs.

### Input Methods

All input methods return `Promise<T | null>` where `null` indicates cancellation.

#### `input.text(options)`

Get text input from the user.

```typescript
const name = await input.text({
  message: string,              // The prompt message
  defaultValue?: string,        // Default value
  placeholder?: string,         // Placeholder text
  required?: boolean,           // Whether input is required
  validate?: (value: string) => boolean | string, // Validation function
  multiline?: boolean,          // Enable multiline input
  timeoutMs?: number,           // Timeout in milliseconds
  abortSignal?: AbortSignal,    // For cancellation
});
```

#### `input.number(options)`

Get numeric input from the user.

```typescript
const age = await input.number({
  message: string,              // The prompt message
  defaultValue?: number,        // Default value
  min?: number,                 // Minimum value
  max?: number,                 // Maximum value
  step?: number,                // Step increment
  required?: boolean,           // Whether input is required
  timeoutMs?: number,           // Timeout in milliseconds
  abortSignal?: AbortSignal,    // For cancellation
});
```

#### `input.select<T>(options)`

Show a selection list.

```typescript
const choice = await input.select({
  message: string,              // The prompt message
  options: Array<{              // Options to choose from
    label: string,
    value: T,
  }>,
  defaultValue?: T,             // Default selected value
  required?: boolean,           // Whether selection is required
  timeoutMs?: number,           // Timeout in milliseconds
  abortSignal?: AbortSignal,    // For cancellation
});
```

#### `input.confirm(options)`

Show a yes/no confirmation.

```typescript
const confirmed = await input.confirm({
  message: string,              // The prompt message
  defaultValue?: boolean,       // Default value (true/false)
  required?: boolean,           // Whether confirmation is required
  timeoutMs?: number,           // Timeout in milliseconds
  abortSignal?: AbortSignal,    // For cancellation
});
```

### Advanced Usage

#### Low-level API

For more control, you can use the base `input` function directly:

```typescript
const result = await input<T>({
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

#### Sequential Prompts

Chain multiple prompts with context:

```typescript
async function onboarding() {
  try {
    const name = await input.text({
      message: 'What is your name?',
    });
    
    const email = await input.text({
      message: `Hello ${name}, what's your email?`,
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) || 'Please enter a valid email';
      },
    });
    
    const experience = await input.select({
      message: 'How experienced are you with React?',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
    });
    
    const confirmed = await input.confirm({
      message: 'Ready to start?',
      defaultValue: true,
    });
    
    if (confirmed) {
      // Process the collected data
      console.log({ name, email, experience });
    }
  } catch (error) {
    console.log('User cancelled the flow');
  }
}
```

#### Timeout and Cancellation

```typescript
// With timeout
const result = await input.text({
  message: 'Quick! Enter your name:',
  timeoutMs: 5000, // 5 seconds
});

// With AbortController
const controller = new AbortController();

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10000);

const result = await input.text({
  message: 'Enter your name:',
  abortSignal: controller.signal,
});

// Handle cancellation
if (result === null) {
  console.log('Input was cancelled or timed out');
}
```

## 🎯 Flexible Placement

The `PromptInputRenderer` component can be placed anywhere within your application, allowing for complete control over where prompts appear.

### Fixed Bottom Panel

```tsx
<InputProvider>
  <MainContent />
  <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
    <PromptInputRenderer />
  </div>
</InputProvider>
```

### Modal Overlay

```tsx
<InputProvider>
  <App />
  <ModalOverlay>
    <PromptInputRenderer />
  </ModalOverlay>
</InputProvider>
```

### Queue Visualization

Show all queued prompts with reduced opacity for inactive ones:

```tsx
<InputProvider>
  <div>
    <h2>Active Prompt</h2>
    <PromptInputRenderer />
  </div>
  <div>
    <h2>All Queued Prompts</h2>
    <PromptInputRenderer renderEntireQueue={true} />
  </div>
</InputProvider>
```

### Multiple Renderers

You can have multiple `PromptInputRenderer` components with different configurations:

```tsx
<InputProvider>
  <Sidebar>
    {/* Only show current prompt in sidebar */}
    <PromptInputRenderer />
  </Sidebar>
  <MainArea>
    {/* Show entire queue in main area */}
    <PromptInputRenderer renderEntireQueue={true} />
  </MainArea>
</InputProvider>
```

## ⚡ Priority-Based Queueing

The system supports priority-based queueing, allowing critical inputs to take precedence over background displays.

### Enabling Priority Mode

```tsx
<PromptInputRenderer prioritizeAwaitingInputs={true} />
```

### Setting Custom Priorities

```typescript
// High priority input (default: 10 when prioritizeAwaitingInputs is true)
const urgentInput = await input({
  message: 'Enter security code:',
  priority: 20, // Higher number = higher priority
});

// Low priority display (default: 0)
const monitor = display({
  message: 'System monitor',
  priority: 0, // Will be suspended for higher priority inputs
});

// Medium priority input
const normalInput = await input({
  message: 'Enter your name:',
  priority: 5,
});
```

### Priority Behavior

When `prioritizeAwaitingInputs` is enabled:
- Awaiting inputs (using `await input()`) automatically get priority 10
- Display prompts get priority 0 by default
- Higher priority prompts suspend lower priority displays
- Suspended displays automatically resume when queue is clear

### Use Cases

- **Interrupting long operations**: Suspend status displays for urgent user inputs
- **Security prompts**: Ensure authentication takes precedence
- **Critical alerts**: Handle important notifications immediately
- **Background monitoring**: Show system status without blocking user interaction

```tsx
// Example: Chat with interrupt support
const streamResponse = display({
  message: 'AI typing...',
  priority: 0, // Can be interrupted
});

// This will suspend the display
const urgentQuestion = await input({
  message: 'Interrupt with urgent question:',
  priority: 15, // Takes over immediately
});

// Display resumes automatically after input is resolved
```

## 🎨 Creating Custom Renderers

Create your own renderer components for custom input types:

```tsx
import type { RendererProps } from 'react-imperative-prompt';

interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
}

function ColorPickerRenderer({ 
  prompt, 
  queueLength, 
  onSubmit, 
  onCancel 
}: RendererProps<ColorValue>) {
  const [color, setColor] = useState<ColorValue>({
    hex: '#000000',
    rgb: { r: 0, g: 0, b: 0 },
  });
  
  return (
    <div className="modal">
      <h2>{prompt.message}</h2>
      {queueLength > 0 && (
        <p>{queueLength} more prompts remaining</p>
      )}
      
      {/* Your custom color picker UI */}
      <input 
        type="color" 
        value={color.hex}
        onChange={(e) => setColor(hexToColorValue(e.target.value))}
      />
      
      <button onClick={() => onSubmit(color)}>Select</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}

// Register your renderer
initInput({
  renderers: {
    ...webRenderers,
    colorPicker: ColorPickerRenderer,
  },
  defaultRenderer: 'text',
});

// Use it with the low-level API
const color = await input<ColorValue>({
  message: 'Choose a color',
  kind: 'colorPicker',
});

// Or create a convenience method
const selectColor = (options: BaseInputOptions<ColorValue>) =>
  input<ColorValue>({
    ...options,
    kind: 'colorPicker',
  });

const color = await selectColor({
  message: 'Choose your theme color',
});
```

## 📚 Examples

Check out the [`examples`](./examples) directory for complete working examples:

### [Next.js 15 Web App](./examples/web-nextjs15)
Full-featured web application demonstrating:
- All input types (text, number, select, confirm)
- Form validation
- Sequential multi-step flows
- Styled modal components

### [Ink CLI Application](./examples/cli-ink)
Three CLI examples showcasing:
- Basic profile wizard
- Interactive menu-driven demo
- Complex project configuration wizard

## 🏗️ Built-in Renderers

### Web Renderers (`webRenderers`)
- `text` - Text input modal
- `number` - Numeric input modal
- `email` - Email input with validation
- `password` - Password input (masked)
- `default` - Fallback renderer

### Ink Renderers (`inkRenderers`)
- `text` - Terminal text input
- `number` - Terminal numeric input
- `select` - Terminal selection list
- `confirm` - Terminal yes/no prompt
- `default` - Fallback renderer

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT