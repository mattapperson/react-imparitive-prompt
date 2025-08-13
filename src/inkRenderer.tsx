// inkRenderer.tsx
import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { RendererProps, InputRenderers } from './types';

/** TEXT/EMAIL/PASSWORD share the same component (string in, string out) */
export function TextInputPrompt({ prompt, queueLength, onSubmit, onCancel }: RendererProps<string>) {
  const [value, setValue] = React.useState<string>(prompt.defaultValue ?? '');

  const handleSubmit = React.useCallback((inputValue: string) => {
    if (prompt.required && inputValue.trim() === '') {
      return; // Don't submit empty required fields
    }
    onSubmit(inputValue);
  }, [prompt.required, onSubmit]);

  React.useEffect(() => {
    const handleKeyPress = (_input: string, key: any) => {
      if (key.escape) {
        onCancel();
      }
    };

    process.stdin.on('data', handleKeyPress);
    return () => {
      process.stdin.off('data', handleKeyPress);
    };
  }, [onCancel]);

  return (
    <Box flexDirection="column">
      {queueLength > 0 && (
        <Box marginBottom={1}>
          <Text dimColor>
            {queueLength} more step{queueLength !== 1 ? 's' : ''} remaining
          </Text>
        </Box>
      )}
      
      <Box marginBottom={1}>
        <Text bold>{prompt.message}</Text>
      </Box>
      
      {prompt.placeholder && (
        <Box marginBottom={1}>
          <Text dimColor>({prompt.placeholder})</Text>
        </Box>
      )}
      
      <Box>
        <Text>{'> '}</Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          mask={prompt.kind === 'password' ? '*' : undefined}
        />
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>
          Press Enter to {queueLength > 0 ? 'continue' : 'submit'}, ESC to cancel
        </Text>
      </Box>
    </Box>
  );
}

/** NUMBER prompt returns a number (or null on cancel) */
export function NumberInputPrompt({ prompt, queueLength, onSubmit, onCancel }: RendererProps<number>) {
  const [raw, setRaw] = React.useState<string>(String(prompt.defaultValue ?? ''));

  const handleSubmit = React.useCallback((inputValue: string) => {
    // Empty string is null unless required
    if (inputValue === '') {
      if (prompt.required) {
        return; // Don't submit empty required fields
      }
      onCancel(); // resolve null
      return;
    }
    
    const n = Number(inputValue);
    if (Number.isNaN(n)) {
      if (prompt.required) {
        return; // invalid number for required field
      }
      onCancel();
      return;
    }
    
    onSubmit(n);
  }, [prompt.required, onSubmit, onCancel]);

  React.useEffect(() => {
    const handleKeyPress = (_input: string, key: any) => {
      if (key.escape) {
        onCancel();
      }
    };

    process.stdin.on('data', handleKeyPress);
    return () => {
      process.stdin.off('data', handleKeyPress);
    };
  }, [onCancel]);

  return (
    <Box flexDirection="column">
      {queueLength > 0 && (
        <Box marginBottom={1}>
          <Text dimColor>
            {queueLength} more step{queueLength !== 1 ? 's' : ''} remaining
          </Text>
        </Box>
      )}
      
      <Box marginBottom={1}>
        <Text bold>{prompt.message}</Text>
      </Box>
      
      {prompt.placeholder && (
        <Box marginBottom={1}>
          <Text dimColor>({prompt.placeholder})</Text>
        </Box>
      )}
      
      <Box>
        <Text>{'> '}</Text>
        <TextInput
          value={raw}
          onChange={setRaw}
          onSubmit={handleSubmit}
        />
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>
          Enter a number. Press Enter to {queueLength > 0 ? 'continue' : 'submit'}, ESC to cancel
        </Text>
      </Box>
    </Box>
  );
}

export const inkRenderers: InputRenderers = {
  /** generic string kinds */
  text: TextInputPrompt,
  email: TextInputPrompt,
  password: TextInputPrompt,
  /** number kind */
  number: NumberInputPrompt,
  /** fallback/default */
  default: TextInputPrompt,
};