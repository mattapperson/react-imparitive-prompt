// inputManager.ts
import type { InputConfig, InputEvents, InputOptions, InputPrompt, InputRenderer } from './types'

function uuid(): string {
  // SSR-safe
  // @ts-ignore
  const c = globalThis?.crypto as Crypto | undefined
  // @ts-ignore
  if (c?.randomUUID) return c.randomUUID()
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export class InputManager {
  private queue: Array<InputPrompt<any>> = []
  private currentPrompt: InputPrompt<any> | null = null
  private listeners: Set<() => void> = new Set()
  private eventListeners: Set<(evt: InputEvents) => void> = new Set()
  private config: InputConfig | null = null

  init(config: InputConfig) {
    if (!config.defaultRenderer) {
      throw new Error('InputManager.init: defaultRenderer is required')
    }
    if (!config.renderers[config.defaultRenderer]) {
      console.warn('InputManager.init: defaultRenderer not found in renderers map')
    }
    this.config = config
  }

  input<V = string>(options: InputOptions<V>): Promise<V | null> {
    if (!this.config) {
      throw new Error('InputManager.init() must be called first')
    }

    return new Promise<V | null>((resolve) => {
      const id = uuid()
      const prompt: InputPrompt<V> = { ...options, id, resolve }

      // Attach abort/timeout handling before enqueue so we can cancel while queued
      const cleanup: Array<() => void> = []

      if (options.abortSignal) {
        const onAbort = () => this.cancelPrompt(id, 'abort', resolve as (v: unknown) => void)
        options.abortSignal.addEventListener('abort', onAbort, { once: true })
        cleanup.push(() => options.abortSignal?.removeEventListener('abort', onAbort))
      }

      if (typeof options.timeoutMs === 'number' && options.timeoutMs > 0) {
        const t = setTimeout(
          () => this.cancelPrompt(id, 'timeout', resolve as (v: unknown) => void),
          options.timeoutMs,
        )
        cleanup.push(() => clearTimeout(t))
      }

      // Wrap resolve to ensure cleanup always runs exactly once
      const originalResolve = prompt.resolve
      prompt.resolve = (value) => {
        try {
          originalResolve(value)
        } finally {
          cleanup.forEach((fn) => fn())
        }
      }

      this.queue.push(prompt)
      this.processQueue()
      // Notify after adding to queue so UI can see updated queue length
      this.notify()
    })
  }

  /** Cancels a prompt whether it is current or still in queue. Always advances the queue. */
  private cancelPrompt(
    id: string,
    reason: InputEvents['type'] extends never
      ? never
      : 'abort' | 'timeout' | 'missing-renderer' | 'manual',
    directResolve?: (v: unknown) => void,
  ) {
    // If it's the current prompt
    if (this.currentPrompt && this.currentPrompt.id === id) {
      const p = this.currentPrompt
      this.currentPrompt = null
      try {
        p.resolve(null)
        this.emit({ type: 'prompt:canceled', id, reason })
      } finally {
        this.notify()
        this.processQueue()
      }
      return
    }

    // If it's still in the queue
    const idx = this.queue.findIndex((p) => p.id === id)
    if (idx >= 0) {
      const [p] = this.queue.splice(idx, 1)
      try {
        ;(directResolve ?? p.resolve)(null)
        this.emit({ type: 'prompt:canceled', id, reason })
      } finally {
        this.notify()
        // No need to processQueue here; current may still be active.
      }
      return
    }

    // Already resolved or unknown; ignore.
  }

  private processQueue() {
    if (!this.currentPrompt && this.queue.length > 0) {
      const nextPrompt = this.queue.shift()
      if (nextPrompt) {
        this.currentPrompt = nextPrompt
        this.emit({
          type: 'prompt:shown',
          id: this.currentPrompt.id,
          kind: this.currentPrompt.kind,
        })
        this.notify()
      }
    }
  }

  getCurrentPrompt(): InputPrompt<any> | null {
    return this.currentPrompt
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getRenderer(kind?: string): InputRenderer<any> | null {
    if (!this.config) return null
    const key = kind ?? this.config.defaultRenderer
    return this.config.renderers[key] ?? null
  }

  /** Always advances the queue on success. Guards duplicate resolve by ID check. */
  resolvePrompt(id: string, value: unknown) {
    if (!this.currentPrompt) return
    if (this.currentPrompt.id !== id) {
      console.warn('resolvePrompt called with non-current id', { id })
      return
    }
    const { resolve } = this.currentPrompt
    this.currentPrompt = null
    try {
      resolve(value)
      this.emit({ type: 'prompt:resolved', id })
    } finally {
      this.notify()
      this.processQueue()
    }
  }

  /** Missing renderer policy handler — will not deadlock. */
  handleMissingRenderer() {
    if (!this.config || !this.currentPrompt) return
    const policy = this.config.onMissingRenderer ?? 'resolve-null'
    const id = this.currentPrompt.id

    if (policy === 'throw') {
      // Still advance the queue by cancelling; but surface the error:
      console.error(`No renderer for kind: ${this.currentPrompt.kind}`)
      this.cancelPrompt(id, 'missing-renderer')
      return
    }
    if (policy === 'reject' || policy === 'resolve-null') {
      this.cancelPrompt(id, 'missing-renderer')
      return
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  subscribeEvents(listener: (evt: InputEvents) => void) {
    this.eventListeners.add(listener)
    return () => {
      this.eventListeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((l) => l())
  }

  private emit(evt: InputEvents) {
    this.eventListeners.forEach((l) => l(evt))
  }
}

export const inputManager = new InputManager()
export const input = <V = string>(opts: InputOptions<V>) => inputManager.input<V>(opts)
export const initInput = (config: InputConfig) => inputManager.init(config)
