import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { InputManager } from '../inputManager'
import type { InputConfig, InputRenderer } from '../types'

describe('InputManager.display', () => {
  let manager: InputManager

  beforeEach(() => {
    manager = new InputManager()
    const config: InputConfig = {
      renderers: { default: (() => null) as unknown as InputRenderer },
      defaultRenderer: 'default',
    }
    manager.init(config)
  })

  afterEach(() => {
    // Clean up any active displays
  })

  it('should throw if not initialized', () => {
    const uninitManager = new InputManager()
    expect(() => uninitManager.display({ message: 'test' })).toThrow(
      'InputManager.init() must be called first',
    )
  })

  it('should create a display handle with submitted, cancel, and update methods', () => {
    const handle = manager.display({ message: 'test display' })

    expect(handle).toHaveProperty('submitted')
    expect(handle).toHaveProperty('cancel')
    expect(handle).toHaveProperty('update')
    expect(handle).toHaveProperty('id')
    expect(typeof handle.cancel).toBe('function')
    expect(typeof handle.update).toBe('function')
  })

  it('should yield initial value if provided', async () => {
    const handle = manager.display({
      message: 'test display',
      initialValue: 'initial',
    })

    const { value, done } = await handle.submitted.next()
    expect(value).toBe('initial')
    expect(done).toBe(false)

    handle.cancel()
  })

  it('should yield updated values', async () => {
    const handle = manager.display({ message: 'test display' })

    // Start consuming the generator
    const promise = handle.submitted.next()

    // Update with a value
    handle.update('first update')

    const { value, done } = await promise
    expect(value).toBe('first update')
    expect(done).toBe(false)

    handle.cancel()
  })

  it('should buffer multiple updates', async () => {
    const handle = manager.display({ message: 'test display' })

    // Update multiple times before consuming
    handle.update('first')
    handle.update('second')
    handle.update('third')

    // Consume all buffered values
    const first = await handle.submitted.next()
    expect(first.value).toBe('first')

    const second = await handle.submitted.next()
    expect(second.value).toBe('second')

    const third = await handle.submitted.next()
    expect(third.value).toBe('third')

    handle.cancel()
  })

  it('should complete generator when cancelled', async () => {
    const handle = manager.display({ message: 'test display' })

    // Start consuming
    const promise = handle.submitted.next()

    // Cancel the display
    handle.cancel()

    // Generator should complete
    const { done } = await promise
    expect(done).toBe(true)
  })

  it('should support multiple active displays', () => {
    const handle1 = manager.display({ message: 'display 1' })
    const handle2 = manager.display({ message: 'display 2' })

    expect(handle1.id).not.toBe(handle2.id)

    const activeDisplays = manager.getActiveDisplays()
    expect(activeDisplays).toHaveLength(2)

    handle1.cancel()
    expect(manager.getActiveDisplays()).toHaveLength(1)

    handle2.cancel()
    expect(manager.getActiveDisplays()).toHaveLength(0)
  })

  it('should emit appropriate events', async () => {
    const events: any[] = []
    const unsubscribe = manager.subscribeEvents((evt) => events.push(evt))

    const handle = manager.display({
      message: 'test display',
      kind: 'progress',
    })

    // Should emit display:started
    expect(events).toContainEqual({
      type: 'display:started',
      id: handle.id,
      kind: 'progress',
    })

    // Update should emit display:updated
    handle.update('new value')
    expect(events).toContainEqual({
      type: 'display:updated',
      id: handle.id,
      value: 'new value',
    })

    // Cancel should emit display:canceled
    handle.cancel()
    expect(events).toContainEqual({
      type: 'display:canceled',
      id: handle.id,
    })

    unsubscribe()
  })

  it('should handle async iteration pattern', async () => {
    const handle = manager.display<string>({ message: 'test display' })
    const values: string[] = []

    // Start async iteration in background
    const iterationPromise = (async () => {
      for await (const value of handle.submitted) {
        values.push(value)
        if (values.length >= 3) break
      }
    })()

    // Send values
    handle.update('one')
    handle.update('two')
    handle.update('three')

    await iterationPromise
    expect(values).toEqual(['one', 'two', 'three'])

    handle.cancel()
  })

  it('should ignore updates after cancellation', () => {
    const handle = manager.display({ message: 'test display' })

    handle.cancel()

    // Should not throw, just be ignored
    expect(() => handle.update('ignored')).not.toThrow()

    // Display should not be active
    expect(manager.getActiveDisplays()).toHaveLength(0)
  })

  it('should clean up when generator is not fully consumed', async () => {
    const handle = manager.display({ message: 'test display' })

    // Consume one value
    handle.update('value')
    await handle.submitted.next()

    // Cancel without consuming more
    handle.cancel()

    // Should be cleaned up
    expect(manager.getActiveDisplays()).toHaveLength(0)
  })
})
