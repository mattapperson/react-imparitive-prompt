// types.ts
import type React from 'react'

export interface BaseInputOptions<V> {
  message: string
  placeholder?: string
  defaultValue?: V
  /** Domain concept for choosing a renderer; do NOT overload HTML input type. */
  kind?: string
  required?: boolean
  /** Free-form bag for renderer-level config, not indexed-any */
  meta?: Record<string, unknown>
  /** Optional cancellation/timeout controls (handled by InputManager) */
  abortSignal?: AbortSignal
  timeoutMs?: number
  /** Priority for queue ordering. Higher numbers = higher priority. Default is 0 for display, 10 for awaiting inputs */
  priority?: number
}

export type InputOptions<V = string> = BaseInputOptions<V>

export interface InputPrompt<V = unknown> extends BaseInputOptions<V> {
  id: string
  resolve: (value: V | null) => void
}

export interface DisplayOptions<V = unknown>
  extends Omit<BaseInputOptions<V>, 'abortSignal' | 'timeoutMs'> {
  /** Optional initial value to yield */
  initialValue?: V
}

export interface DisplayHandle<V = unknown> {
  /** Async generator that yields values until cancelled */
  submitted: AsyncGenerator<V, void, unknown>
  /** Cancel the display and complete the generator */
  cancel: () => void
  /** Update the current value being displayed */
  update: (value: V) => void
  /** The display prompt ID */
  id: string
}

export interface RendererProps<V> {
  prompt: InputPrompt<V> | DisplayPrompt<V>
  queueLength: number
  onSubmit: (value: V) => void
  onCancel: () => void
  /** For display mode - update the current value */
  onUpdate?: (value: V) => void
}

export interface DisplayPrompt<V = unknown> extends DisplayOptions<V> {
  id: string
  type: 'display'
  currentValue?: V
}

export type InputRenderer<V = unknown> = React.ComponentType<RendererProps<V>>

export interface InputRenderers {
  [key: string]: InputRenderer<any>
}

export type MissingRendererPolicy = 'resolve-null' | 'reject' | 'throw'

export interface InputConfig {
  renderers: InputRenderers
  /** Must be explicit; never guess the first key. */
  defaultRenderer: string
  onMissingRenderer?: MissingRendererPolicy
}

/** Optional event stream for telemetry/analytics. */
export type InputEvents =
  | { type: 'prompt:shown'; id: string; kind?: string }
  | { type: 'prompt:resolved'; id: string }
  | {
      type: 'prompt:canceled'
      id: string
      reason: 'abort' | 'timeout' | 'missing-renderer' | 'manual'
    }
  | { type: 'display:started'; id: string; kind?: string }
  | { type: 'display:updated'; id: string; value: unknown }
  | { type: 'display:canceled'; id: string }
