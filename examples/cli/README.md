# React Imperative Prompt - Ink CLI Examples

This directory contains examples of using `react-imperative-prompt` with Ink for building interactive CLI applications.

## Examples

### 1. Basic CLI (`src/cli.tsx`)
A simple profile creation wizard that demonstrates basic input types:
- Text input with validation
- Number input with min/max constraints
- Select dropdown
- Confirmation prompts
- Sequential flow with context

### 2. Interactive Demo (`src/interactive-demo.tsx`)
An interactive menu-driven demo that lets you explore different input types:
- Navigate with arrow keys
- Test each input type individually
- View results history
- Persistent interface

### 3. Project Wizard (`src/wizard.tsx`)
A comprehensive project setup wizard similar to `create-react-app`:
- Multi-step configuration flow
- Conditional questions based on previous answers
- Summary and confirmation
- Real-world use case example

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript files:
```bash
npm run build
```

3. Run the examples:

```bash
# Basic CLI
npm run dev -- src/cli.tsx

# Interactive Demo
npm run dev -- src/interactive-demo.tsx

# Project Wizard
npm run dev -- src/wizard.tsx
```

Or after building:
```bash
node dist/cli.js
node dist/interactive-demo.js
node dist/wizard.js
```

## Key Features

- **Ink Integration**: Seamless integration with Ink for terminal UI
- **TypeScript Support**: Fully typed examples
- **Interactive Prompts**: Text, number, select, and confirm inputs
- **Validation**: Custom validation functions
- **Sequential Flow**: Chain prompts with context
- **Error Handling**: Graceful cancellation and error states

## Implementation Notes

- Uses the `inkRenderers` from `react-imperative-prompt/ink`
- Wraps the app with `InputProvider` 
- Leverages Ink's components for rich terminal UI
- Handles async/await patterns for sequential prompts