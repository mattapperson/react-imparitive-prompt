/**
 * Example demonstrating flexible placement of PromptInputRenderer
 * 
 * The PromptInputRenderer can be placed anywhere within the InputProvider,
 * allowing for flexible UI layouts and multiple rendering modes.
 */

import React from 'react'
import { 
  InputProvider, 
  PromptInputRenderer, 
  initInput, 
  input 
} from '../src'
import type { RendererProps } from '../src/types'

// Example custom renderer
const CustomTextInput: React.FC<RendererProps<string>> = ({ 
  prompt, 
  queueLength, 
  onSubmit, 
  onCancel 
}) => {
  const [value, setValue] = React.useState(prompt.defaultValue || '')

  return (
    <div style={{ 
      padding: '10px', 
      border: '1px solid #ccc', 
      borderRadius: '4px',
      marginBottom: '10px' 
    }}>
      <label>{prompt.message}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={prompt.placeholder}
        style={{ width: '100%', marginTop: '5px' }}
      />
      <div style={{ marginTop: '10px' }}>
        <button onClick={() => onSubmit(value)}>Submit</button>
        <button onClick={onCancel} style={{ marginLeft: '10px' }}>Cancel</button>
        {queueLength > 0 && (
          <span style={{ marginLeft: '10px', color: '#666' }}>
            ({queueLength} more in queue)
          </span>
        )}
      </div>
    </div>
  )
}

// Initialize the input system
initInput({
  renderers: {
    text: CustomTextInput,
  },
  defaultRenderer: 'text',
})

// Example 1: Basic usage with prompt renderer at the bottom
export const BasicLayoutExample = () => {
  const handleAction = async () => {
    const name = await input({ 
      message: 'What is your name?',
      placeholder: 'Enter your name...'
    })
    console.log('Name:', name)
  }

  return (
    <InputProvider>
      <div style={{ padding: '20px' }}>
        <h1>My Application</h1>
        <button onClick={handleAction}>Start Input Flow</button>
        
        <div style={{ marginTop: '20px' }}>
          <h2>Content Area</h2>
          <p>This is the main content of the application.</p>
        </div>

        {/* Prompt renderer at the bottom */}
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '20px',
          backgroundColor: 'white',
          borderTop: '1px solid #ccc'
        }}>
          <PromptInputRenderer />
        </div>
      </div>
    </InputProvider>
  )
}

// Example 2: Modal-style rendering
export const ModalLayoutExample = () => {
  const handleAction = async () => {
    const email = await input({ 
      message: 'Enter your email address:',
      placeholder: 'email@example.com'
    })
    console.log('Email:', email)
  }

  return (
    <InputProvider>
      <div style={{ padding: '20px' }}>
        <h1>Modal Example</h1>
        <button onClick={handleAction}>Get Email</button>
        
        {/* Modal overlay with centered prompt */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ 
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '400px',
            pointerEvents: 'auto'
          }}>
            <PromptInputRenderer />
          </div>
        </div>
      </div>
    </InputProvider>
  )
}

// Example 3: Queue visualization with renderEntireQueue
export const QueueVisualizationExample = () => {
  const handleMultipleInputs = async () => {
    // Queue up multiple inputs
    const promises = [
      input({ message: 'First question:' }),
      input({ message: 'Second question:' }),
      input({ message: 'Third question:' }),
    ]
    
    const results = await Promise.all(promises)
    console.log('All results:', results)
  }

  return (
    <InputProvider>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Main content */}
        <div style={{ flex: 1, padding: '20px' }}>
          <h1>Queue Visualization</h1>
          <button onClick={handleMultipleInputs}>Queue Multiple Inputs</button>
          
          <div style={{ marginTop: '20px' }}>
            <h2>Current Active Prompt</h2>
            <PromptInputRenderer />
          </div>
        </div>

        {/* Queue sidebar */}
        <div style={{ 
          width: '300px', 
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderLeft: '1px solid #ccc'
        }}>
          <h2>Input Queue</h2>
          <p>All pending prompts:</p>
          <PromptInputRenderer renderEntireQueue={true} />
        </div>
      </div>
    </InputProvider>
  )
}

// Example 4: Multiple prompt renderers in different locations
export const MultipleRenderersExample = () => {
  const [showSidebar, setShowSidebar] = React.useState(false)

  const handleAction = async () => {
    setShowSidebar(true)
    const response = await input({ 
      message: 'This prompt appears in the sidebar:',
    })
    console.log('Response:', response)
    setShowSidebar(false)
  }

  return (
    <InputProvider>
      <div style={{ display: 'flex' }}>
        {/* Main area */}
        <div style={{ flex: 1, padding: '20px' }}>
          <h1>Multiple Renderers</h1>
          <button onClick={handleAction}>Show Prompt in Sidebar</button>
          
          <div style={{ marginTop: '20px' }}>
            <h2>Main Area Prompt</h2>
            {/* This renderer only shows if sidebar is hidden */}
            {!showSidebar && <PromptInputRenderer />}
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div style={{ 
            width: '400px', 
            padding: '20px',
            backgroundColor: '#f0f0f0'
          }}>
            <h2>Sidebar Prompt</h2>
            <PromptInputRenderer />
          </div>
        )}
      </div>
    </InputProvider>
  )
}

// Example 5: Inline prompt rendering
export const InlinePromptExample = () => {
  const [items, setItems] = React.useState<string[]>([])

  const handleAddItem = async () => {
    const newItem = await input({ 
      message: 'Enter a new item:',
      placeholder: 'Type here...'
    })
    if (newItem) {
      setItems([...items, newItem])
    }
  }

  return (
    <InputProvider>
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <h1>Todo List</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <button onClick={handleAddItem}>Add Item</button>
        </div>

        {/* Inline prompt appears here */}
        <div style={{ 
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px'
        }}>
          <PromptInputRenderer />
        </div>

        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </InputProvider>
  )
}