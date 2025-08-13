# React Imperative Prompt - Next.js 15 Example

This example demonstrates how to use `react-imperative-prompt` with Next.js 15.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features Demonstrated

- **Text Input**: Basic text input with default values
- **Number Input**: Numeric input with min/max validation
- **Email Input**: Text input with custom validation
- **Multiline Text**: Textarea for longer content
- **Select Options**: Dropdown selection with custom options
- **Confirm Dialog**: Yes/No confirmation prompts
- **Sequential Flow**: Multi-step input flow with context

## Key Implementation Details

- Uses Next.js 15 with App Router
- Client-side provider setup in `providers.tsx`
- Imperative API usage in page components
- Built-in web renderers for modal UI
- Fully typed with TypeScript