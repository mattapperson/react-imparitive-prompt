# React Imperative Prompt Examples

This directory contains example implementations of `react-imperative-prompt` for different platforms and use cases.

## Available Examples

### 🌐 Web - Next.js 15
**Location:** `web-nextjs15/`

A full-featured web application example using Next.js 15 with App Router, demonstrating:
- Modal-based input prompts
- Form validation
- Sequential input flows
- Styled components
- TypeScript integration

[View Example →](./web-nextjs15/)

### ⌨️ CLI - Ink
**Location:** `cli-ink/`

Terminal-based CLI applications using Ink, featuring:
- Interactive command-line prompts
- Menu-driven interfaces
- Multi-step wizards
- Rich terminal UI components
- Async input handling

[View Example →](./cli-ink/)

## Quick Start

Each example has its own dependencies and setup instructions. Navigate to the specific example directory and follow the README instructions.

### General Steps:

1. **Navigate to example:**
   ```bash
   cd web-nextjs15
   # or
   cd cli-ink
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the example:**
   ```bash
   npm run dev
   ```

## Library Features Demonstrated

All examples showcase the core features of `react-imperative-prompt`:

- **Imperative API**: Use `await input.text()` style calls
- **Multiple Input Types**: Text, number, select, confirm
- **Validation**: Built-in and custom validators
- **Default Values**: Pre-filled inputs
- **Sequential Flows**: Chain inputs with context
- **Error Handling**: Graceful cancellation
- **TypeScript**: Full type safety
- **Platform-Specific Renderers**: Web modals vs. terminal UI

## Adding Your Own Example

To add a new example:

1. Create a new directory under `examples/`
2. Include a `package.json` with the library as a dependency
3. Implement the `InputProvider` with appropriate renderers
4. Add a README with setup instructions
5. Update this main README with your example

## License

All examples are MIT licensed and free to use as starting points for your own projects.