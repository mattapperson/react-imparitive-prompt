#!/usr/bin/env node
import React, { useState } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import { InputProvider, inkRenderers, input, initInput } from 'react-imperative-prompt/ink';

// Initialize input system
initInput({
  renderers: inkRenderers,
  defaultRenderer: 'text',
});

type DemoOption = 'text' | 'number' | 'select' | 'confirm' | 'sequential' | 'exit';

interface DemoResult {
  type: string;
  value: any;
  timestamp: Date;
}

const InteractiveDemo: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState(0);
  const [results, setResults] = useState<DemoResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { exit } = useApp();

  const options: Array<{ key: DemoOption; label: string; description: string }> = [
    { key: 'text', label: 'Text Input', description: 'Get text input from user' },
    { key: 'number', label: 'Number Input', description: 'Get numeric input with validation' },
    { key: 'select', label: 'Select Options', description: 'Choose from a list of options' },
    { key: 'confirm', label: 'Confirmation', description: 'Yes/No confirmation prompt' },
    { key: 'sequential', label: 'Sequential Flow', description: 'Multi-step input process' },
    { key: 'exit', label: 'Exit', description: 'Exit the demo' },
  ];

  useInput(async (input, key) => {
    if (isRunning) return;

    if (key.upArrow) {
      setSelectedOption((prev) => (prev - 1 + options.length) % options.length);
    } else if (key.downArrow) {
      setSelectedOption((prev) => (prev + 1) % options.length);
    } else if (key.return) {
      await runDemo(options[selectedOption].key);
    }
  });

  const runDemo = async (demo: DemoOption) => {
    if (demo === 'exit') {
      exit();
      return;
    }

    setIsRunning(true);

    try {
      switch (demo) {
        case 'text': {
          const result = await input.text({
            message: 'Enter some text:',
            placeholder: 'Type here...',
            defaultValue: 'Hello, world!',
          });
          setResults((prev) => [...prev, { type: 'Text', value: result, timestamp: new Date() }]);
          break;
        }

        case 'number': {
          const result = await input.number({
            message: 'Enter a number between 1 and 100:',
            min: 1,
            max: 100,
            defaultValue: 50,
          });
          setResults((prev) => [...prev, { type: 'Number', value: result, timestamp: new Date() }]);
          break;
        }

        case 'select': {
          const result = await input.select({
            message: 'Choose your favorite programming language:',
            options: [
              { label: 'TypeScript', value: 'ts' },
              { label: 'JavaScript', value: 'js' },
              { label: 'Python', value: 'py' },
              { label: 'Rust', value: 'rs' },
              { label: 'Go', value: 'go' },
            ],
          });
          setResults((prev) => [...prev, { type: 'Select', value: result, timestamp: new Date() }]);
          break;
        }

        case 'confirm': {
          const result = await input.confirm({
            message: 'Do you like this demo?',
            defaultValue: true,
          });
          setResults((prev) => [...prev, { type: 'Confirm', value: result ? 'Yes' : 'No', timestamp: new Date() }]);
          break;
        }

        case 'sequential': {
          const name = await input.text({
            message: 'What is your name?',
          });

          const language = await input.select({
            message: `Nice to meet you, ${name}! What\'s your favorite language?`,
            options: [
              { label: 'TypeScript', value: 'TypeScript' },
              { label: 'JavaScript', value: 'JavaScript' },
              { label: 'Python', value: 'Python' },
            ],
          });

          const years = await input.number({
            message: `How many years have you been using ${language}?`,
            min: 0,
            max: 50,
          });

          const summary = `${name} has been using ${language} for ${years} year(s)`;
          setResults((prev) => [...prev, { type: 'Sequential', value: summary, timestamp: new Date() }]);
          break;
        }
      }
    } catch (error) {
      // User cancelled
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🎯 React Imperative Prompt - Interactive CLI Demo
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to select, Ctrl+C to exit</Text>
      </Box>

      {!isRunning && (
        <Box flexDirection="column" marginBottom={1}>
          {options.map((option, index) => (
            <Box key={option.key}>
              <Text color={selectedOption === index ? 'green' : 'white'}>
                {selectedOption === index ? '❯ ' : '  '}
                <Text bold={selectedOption === index}>{option.label}</Text>
                {' - '}
                <Text dimColor>{option.description}</Text>
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {results.length > 0 && (
        <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1} marginTop={1}>
          <Box marginBottom={1}>
            <Text bold color="yellow">
              📝 Results:
            </Text>
          </Box>
          {results.slice(-5).map((result, index) => (
            <Box key={index} marginBottom={index < results.length - 1 ? 1 : 0}>
              <Text>
                <Text color="blue">[{result.type}]</Text> {String(result.value)}
              </Text>
            </Box>
          ))}
          {results.length > 5 && (
            <Text dimColor italic>
              ... and {results.length - 5} more
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

const Main: React.FC = () => {
  return (
    <InputProvider>
      <InteractiveDemo />
    </InputProvider>
  );
};

render(<Main />);