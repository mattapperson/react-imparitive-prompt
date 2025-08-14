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
}

export type InputOptions<V = string> = BaseInputOptions<V>

export interface InputPrompt<V = unknown> extends BaseInputOptions<V> {
  id: string
  resolve: (value: V | null) => void
}

export interface RendererProps<V> {
  prompt: InputPrompt<V>
  queueLength: number
  onSubmit: (value: V) => void
  onCancel: () => void
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
