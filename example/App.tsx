// App.tsx
import React from 'react';
import { InputProvider } from '../src/InputProvider';
import { input, initInput } from '../src/inputManager';
import { webRenderers } from '../src/webRenderers';

initInput({
  renderers: webRenderers,
  defaultRenderer: 'default',
  onMissingRenderer: 'resolve-null',
});

function ExampleUsage() {
  async function handleBasicInput() {
    const name = await input<string>({
      message: 'Enter your name',
      kind: 'text',
      required: true,
      timeoutMs: 60_000,
    });
    console.log('Name:', name);
  }

  async function handleTypedInputs() {
    // These will serialize in the queue; Promise.all is fine—each resolves in order.
    const [name, email, age] = await Promise.all([
      input<string>({ message: 'Enter your name', kind: 'text', required: true }),
      input<string>({ message: 'Enter your email', kind: 'email' }),
      input<number>({ message: 'Enter your age', kind: 'number', required: true }),
    ]);
    console.log('Data:', { name, email, age });
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Platform-Agnostic Input System</h2>
      <button onClick={handleBasicInput} style={btn('#007bff')}>Basic Input</button>
      <button onClick={handleTypedInputs} style={btn('#28a745')}>Multi-Step Form</button>
    </div>
  );
}

const btn = (bg: string): React.CSSProperties => ({
  display: 'block',
  margin: '10px 0',
  padding: '10px 20px',
  backgroundColor: bg,
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
});

export default function App() {
  return (
    <InputProvider>
      <ExampleUsage />
    </InputProvider>
  );
}