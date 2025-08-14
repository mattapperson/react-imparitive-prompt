// Helper functions for common input types
import { input as baseInput } from './inputManager'
import type { BaseInputOptions } from './types'

interface TextOptions extends BaseInputOptions<string> {
  validate?: (value: string) => boolean | string
  multiline?: boolean
}

interface NumberOptions extends BaseInputOptions<number> {
  min?: number
  max?: number
  step?: number
}

interface SelectOptions<T = string> extends BaseInputOptions<T> {
  options: Array<{ label: string; value: T }>
}

interface ConfirmOptions extends BaseInputOptions<boolean> {
  // No additional options needed
}

export const input = Object.assign(baseInput, {
  text: (options: TextOptions) => {
    const { validate, multiline, ...rest } = options
    return baseInput<string>({
      ...rest,
      kind: 'text',
      meta: {
        validate,
        multiline,
      },
    })
  },

  number: (options: NumberOptions) => {
    const { min, max, step, ...rest } = options
    return baseInput<number>({
      ...rest,
      kind: 'number',
      meta: {
        min,
        max,
        step,
      },
    })
  },

  select: <T = string>(options: SelectOptions<T>) => {
    const { options: selectOptions, ...rest } = options
    return baseInput<T>({
      ...rest,
      kind: 'select',
      meta: {
        options: selectOptions,
      },
    })
  },

  confirm: (options: ConfirmOptions) =>
    baseInput<boolean>({
      ...options,
      kind: 'confirm',
    }),
})
