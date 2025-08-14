/**
 * Example demonstrating priority-based input rendering
 *
 * Shows how awaiting inputs can take priority over display inputs,
 * temporarily suspending displays to handle critical user inputs.
 */

import React from 'react'
import { display, InputProvider, initInput, input, PromptInputRenderer } from '../src'
import type { RendererProps } from '../src/types'

// Custom renderer that shows the type and priority
const PriorityRenderer: React.FC<RendererProps<any>> = ({
  prompt,
  queueLength,
  onSubmit,
  onCancel,
  onUpdate,
}) => {
  const [value, setValue] = React.useState('')
  const isDisplay = 'type' in prompt && prompt.type === 'display'
  const priority = prompt.priority ?? 0

  return (
    <div
      style={{
        padding: '15px',
        border: `2px solid ${isDisplay ? '#4CAF50' : '#2196F3'}`,
        borderRadius: '8px',
        marginBottom: '10px',
        backgroundColor: isDisplay ? '#E8F5E9' : '#E3F2FD',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <strong>{prompt.message}</strong>
        <div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: isDisplay ? '#4CAF50' : '#2196F3',
              color: 'white',
              fontSize: '12px',
              marginRight: '10px',
            }}
          >
            {isDisplay ? 'DISPLAY' : 'INPUT'}
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#FF9800',
              color: 'white',
              fontSize: '12px',
            }}
          >
            Priority: {priority}
          </span>
        </div>
      </div>

      {!isDisplay && (
        <>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={prompt.placeholder}
            style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
          />
          <div>
            <button type="button" onClick={() => onSubmit(value)}>
              Submit
            </button>
            <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>
              Cancel
            </button>
            {queueLength > 0 && (
              <span style={{ marginLeft: '10px', color: '#666' }}>
                ({queueLength} more in queue)
              </span>
            )}
          </div>
        </>
      )}

      {isDisplay && (
        <div>
          <p>Current value: {prompt.currentValue || 'None'}</p>
          <button type="button" onClick={() => onUpdate?.('Updated!')}>
            Update Display
          </button>
          <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>
            Close Display
          </button>
        </div>
      )}
    </div>
  )
}

// Initialize the input system
initInput({
  renderers: {
    priority: PriorityRenderer,
  },
  defaultRenderer: 'priority',
})

// Example 1: Basic Priority Demo
export const BasicPriorityExample = () => {
  const [log, setLog] = React.useState<string[]>([])

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const startDisplayMonitor = async () => {
    addLog('Starting display monitor...')
    const handle = display({
      message: 'System Monitor (Low Priority)',
      kind: 'priority',
      priority: 0, // Low priority
      initialValue: 'Monitoring...',
    })

    // Simulate updates
    let count = 0
    const interval = setInterval(() => {
      handle.update(`Update ${++count}`)
    }, 2000)

    // Clean up when cancelled
    for await (const value of handle.submitted) {
      addLog(`Display updated: ${value}`)
    }

    clearInterval(interval)
    addLog('Display monitor stopped')
  }

  const requestUrgentInput = async () => {
    addLog('Requesting urgent input...')
    const result = await input({
      message: 'URGENT: Enter authorization code',
      kind: 'priority',
      priority: 10, // High priority - will suspend display
      placeholder: 'Enter code...',
    })
    addLog(`Urgent input received: ${result}`)
  }

  const requestNormalInput = async () => {
    addLog('Requesting normal input...')
    const result = await input({
      message: 'Normal: Enter your name',
      kind: 'priority',
      priority: 5, // Medium priority
      placeholder: 'Enter name...',
    })
    addLog(`Normal input received: ${result}`)
  }

  return (
    <InputProvider>
      <div style={{ padding: '20px' }}>
        <h1>Priority-Based Input System</h1>

        <div style={{ marginBottom: '20px' }}>
          <h2>Actions</h2>
          <button type="button" onClick={startDisplayMonitor} style={{ marginRight: '10px' }}>
            Start Display Monitor (Priority: 0)
          </button>
          <button type="button" onClick={requestNormalInput} style={{ marginRight: '10px' }}>
            Request Normal Input (Priority: 5)
          </button>
          <button type="button" onClick={requestUrgentInput}>
            Request Urgent Input (Priority: 10)
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>Active Prompts (with Priority)</h2>
          <PromptInputRenderer prioritizeAwaitingInputs={true} />
        </div>

        <div>
          <h2>Event Log</h2>
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {log.map((entry, i) => (
              <div
                key={`log-${i}-${entry.substring(0, 10)}`}
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              >
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </InputProvider>
  )
}

// Example 2: Real-world Scenario - Chat with Interrupts
export const ChatWithInterruptsExample = () => {
  const [messages, setMessages] = React.useState<Array<{ role: string; text: string }>>([])
  const [isStreaming, setIsStreaming] = React.useState(false)

  const startChatStream = async () => {
    setIsStreaming(true)
    const handle = display({
      message: 'AI Assistant Response Stream',
      priority: 0, // Low priority - can be interrupted
      initialValue: 'Thinking...',
    })

    // Simulate streaming response
    const fullResponse =
      'This is a long response that simulates an AI assistant typing out a detailed answer to your question. It contains multiple sentences and takes time to complete.'
    const words = fullResponse.split(' ')

    let currentText = ''
    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      currentText += (currentText ? ' ' : '') + word
      handle.update(currentText)
    }

    setMessages((prev) => [...prev, { role: 'Assistant', text: currentText }])
    handle.cancel()
    setIsStreaming(false)
  }

  const askQuestion = async () => {
    const question = await input({
      message: 'Ask a question:',
      placeholder: 'Type your question...',
      priority: 10, // High priority - interrupts streaming
    })

    if (question) {
      setMessages((prev) => [...prev, { role: 'You', text: question }])
      // Start streaming response
      startChatStream()
    }
  }

  const requestClarification = async () => {
    const clarification = await input({
      message: 'INTERRUPT: Need clarification on something?',
      placeholder: 'What needs clarification?',
      priority: 15, // Very high priority - interrupts everything
    })

    if (clarification) {
      setMessages((prev) => [...prev, { role: 'Clarification', text: clarification }])
    }
  }

  return (
    <InputProvider>
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <h1>Chat with Interrupt Support</h1>

        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={askQuestion}
            disabled={isStreaming}
            style={{ marginRight: '10px' }}
          >
            Ask Question
          </button>
          <button type="button" onClick={requestClarification} style={{ marginRight: '10px' }}>
            Interrupt for Clarification
          </button>
          {isStreaming && <span>AI is typing...</span>}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>Current Input/Display</h2>
          <PromptInputRenderer prioritizeAwaitingInputs={true} />
        </div>

        <div>
          <h2>Chat History</h2>
          <div
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '10px',
              height: '300px',
              overflowY: 'auto',
              backgroundColor: 'white',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={`msg-${i}-${msg.role}`}
                style={{
                  marginBottom: '10px',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor:
                    msg.role === 'You'
                      ? '#E3F2FD'
                      : msg.role === 'Clarification'
                        ? '#FFF3E0'
                        : '#F5F5F5',
                }}
              >
                <strong>{msg.role}:</strong> {msg.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </InputProvider>
  )
}

// Example 3: Queue Visualization with Priorities
export const QueueVisualizationWithPriorities = () => {
  const createMultipleTasks = () => {
    // Create tasks with different priorities
    input({
      message: 'Low: Enter email',
      priority: 1,
    })

    input({
      message: 'Medium: Enter phone',
      priority: 5,
    })

    input({
      message: 'High: Enter verification code',
      priority: 10,
    })

    input({
      message: 'Critical: Security check',
      priority: 20,
    })

    display({
      message: 'Background: System status',
      priority: 0,
      initialValue: 'All systems operational',
    })
  }

  return (
    <InputProvider>
      <div style={{ padding: '20px' }}>
        <h1>Priority Queue Visualization</h1>

        <button type="button" onClick={createMultipleTasks} style={{ marginBottom: '20px' }}>
          Create Multiple Priority Tasks
        </button>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <h2>Current Active (Highest Priority)</h2>
            <PromptInputRenderer prioritizeAwaitingInputs={true} />
          </div>

          <div style={{ flex: 1 }}>
            <h2>Full Queue (All Priorities)</h2>
            <div style={{ opacity: 0.7 }}>
              <PromptInputRenderer prioritizeAwaitingInputs={true} renderEntireQueue={true} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          <h3>Priority Guide:</h3>
          <ul>
            <li>0: Background displays (lowest)</li>
            <li>1-5: Normal user inputs</li>
            <li>6-10: Important inputs</li>
            <li>11-20: Critical/Security inputs (highest)</li>
          </ul>
        </div>
      </div>
    </InputProvider>
  )
}
