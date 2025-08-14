// PromptInputRenderer.tsx
import React from 'react'
import { inputManager } from './inputManager'
import type { DisplayPrompt, InputPrompt } from './types'

export interface PromptInputRendererProps {
  /** When true, renders all queued prompts. When false, only renders the current prompt */
  renderEntireQueue?: boolean
  /** When true, awaiting inputs (like input.text()) will take priority over display inputs */
  prioritizeAwaitingInputs?: boolean
}

export function PromptInputRenderer({
  renderEntireQueue = false,
  prioritizeAwaitingInputs = false,
}: PromptInputRendererProps) {
  const [current, setCurrent] = React.useState<InputPrompt<any> | DisplayPrompt<any> | null>(null)
  const [queue, setQueue] = React.useState<(InputPrompt<any> | DisplayPrompt<any>)[]>([])
  const [qLen, setQLen] = React.useState<number>(0)

  React.useEffect(() => {
    // Set the priority mode on the inputManager
    inputManager.setPrioritizeAwaitingInputs(prioritizeAwaitingInputs)
  }, [prioritizeAwaitingInputs])

  React.useEffect(() => {
    // Set initial state
    setCurrent(inputManager.getCurrentPrompt())
    setQueue(inputManager.getQueue())
    setQLen(inputManager.getQueueLength())

    // Subscribe to updates
    const unsubscribe = inputManager.subscribe(() => {
      setCurrent(inputManager.getCurrentPrompt())
      setQueue(inputManager.getQueue())
      setQLen(inputManager.getQueueLength())
    })
    return unsubscribe
  }, [])

  const submit = React.useCallback(
    (promptId: string) => (value: unknown) => {
      inputManager.resolvePrompt(promptId, value)
    },
    [],
  )

  if (renderEntireQueue) {
    // Render all prompts (current + queued)
    const allPrompts = current ? [current, ...queue] : queue

    if (allPrompts.length === 0) return null

    return (
      <>
        {allPrompts.map((prompt, index) => {
          const Renderer = inputManager.getRenderer(prompt.kind)
          if (!Renderer) {
            console.error(`No renderer for kind: ${prompt.kind}`)
            return null
          }

          const isActive = index === 0 && current?.id === prompt.id

          return (
            <div key={prompt.id} style={{ opacity: isActive ? 1 : 0.5 }}>
              <Renderer
                prompt={prompt}
                queueLength={qLen}
                onSubmit={isActive ? submit(prompt.id) : () => {}}
                onCancel={isActive ? () => submit(prompt.id)(null) : () => {}}
              />
            </div>
          )
        })}
      </>
    )
  }

  // Default behavior: only render current prompt
  if (!current) return null

  const Renderer = inputManager.getRenderer(current.kind)
  if (!Renderer) {
    console.error(`No renderer for kind: ${current.kind}`)
    inputManager.handleMissingRenderer()
    return null
  }

  return (
    <Renderer
      prompt={current}
      queueLength={qLen}
      onSubmit={submit(current.id)}
      onCancel={() => submit(current.id)(null)}
    />
  )
}
