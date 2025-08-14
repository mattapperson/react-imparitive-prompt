// inputManager.ts
import type {
  DisplayHandle,
  DisplayOptions,
  DisplayPrompt,
  InputConfig,
  InputEvents,
  InputOptions,
  InputPrompt,
  InputRenderer,
} from './types'

function uuid(): string {
  // SSR-safe
  // @ts-ignore
  const c = globalThis?.crypto as Crypto | undefined
  // @ts-ignore
  if (c?.randomUUID) return c.randomUUID()
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

interface DisplayState<V> {
  prompt: DisplayPrompt<V>
  values: V[]
  subscribers: Set<(value: V) => void>
  isCancelled: boolean
}

export class InputManager {
  private queue: Array<InputPrompt<any>> = []
  private currentPrompt: InputPrompt<any> | null = null
  private listeners: Set<() => void> = new Set()
  private eventListeners: Set<(evt: InputEvents) => void> = new Set()
  private config: InputConfig | null = null
  private activeDisplays: Map<string, DisplayState<any>> = new Map()

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
          for (const fn of cleanup) fn()
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

  display<V = unknown>(options: DisplayOptions<V>): DisplayHandle<V> {
    if (!this.config) {
      throw new Error('InputManager.init() must be called first')
    }

    const id = uuid()
    const prompt: DisplayPrompt<V> = {
      ...options,
      id,
      type: 'display',
      currentValue: options.initialValue,
    }

    const state: DisplayState<V> = {
      prompt,
      values: options.initialValue !== undefined ? [options.initialValue] : [],
      subscribers: new Set(),
      isCancelled: false,
    }

    this.activeDisplays.set(id, state)
    this.emit({ type: 'display:started', id, kind: options.kind })
    this.notify()

    const submitted = this.createDisplayGenerator<V>(id, state)

    const handle: DisplayHandle<V> = {
      submitted,
      id,
      cancel: () => this.cancelDisplay(id),
      update: (value: V) => this.updateDisplay(id, value),
    }

    return handle
  }

  private async *createDisplayGenerator<V>(
    id: string,
    state: DisplayState<V>,
  ): AsyncGenerator<V, void, unknown> {
    try {
      // Yield initial value if present
      if (state.values.length > 0) {
        yield state.values.shift()!
      }

      // Create a promise-based queue for new values
      while (!state.isCancelled) {
        const value = await new Promise<V | symbol>((resolve) => {
          // Check if already cancelled
          if (state.isCancelled) {
            resolve(Symbol.for('cancelled'))
            return
          }

          // Check if there are buffered values
          if (state.values.length > 0) {
            const nextValue = state.values.shift()
            if (nextValue !== undefined) {
              resolve(nextValue)
              return
            }
          }

          // Subscribe to future values
          const unsubscribe = (value: V) => {
            state.subscribers.delete(unsubscribe)
            resolve(value)
          }
          state.subscribers.add(unsubscribe)
        })

        // Check for cancellation signal
        if (value === Symbol.for('cancelled')) {
          break
        }

        yield value as V
      }
    } finally {
      // Cleanup
      this.activeDisplays.delete(id)
      this.notify()
    }
  }

  private updateDisplay<V>(id: string, value: V): void {
    const state = this.activeDisplays.get(id) as DisplayState<V> | undefined
    if (!state || state.isCancelled) return

    state.prompt.currentValue = value

    // Notify all waiting subscribers
    if (state.subscribers.size > 0) {
      const subscriber = state.subscribers.values().next().value
      if (subscriber) {
        subscriber(value)
      }
    } else {
      // Buffer the value if no subscribers
      state.values.push(value)
    }

    this.emit({ type: 'display:updated', id, value })
    this.notify()
  }

  private cancelDisplay(id: string): void {
    const state = this.activeDisplays.get(id)
    if (!state) return

    state.isCancelled = true

    // Notify all subscribers with cancellation
    for (const subscriber of state.subscribers) {
      subscriber(Symbol.for('cancelled') as any)
    }
    state.subscribers.clear()

    this.activeDisplays.delete(id)
    this.emit({ type: 'display:canceled', id })
    this.notify()
  }

  getActiveDisplays(): DisplayPrompt<any>[] {
    return Array.from(this.activeDisplays.values()).map((state) => state.prompt)
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
    for (const l of this.listeners) l()
  }

  private emit(evt: InputEvents) {
    for (const l of this.eventListeners) l(evt)
  }
}

export const inputManager = new InputManager()
export const input = <V = string>(opts: InputOptions<V>) => inputManager.input<V>(opts)
export const display = <V = unknown>(opts: DisplayOptions<V>) => inputManager.display<V>(opts)
export const initInput = (config: InputConfig) => inputManager.init(config)
