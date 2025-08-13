import { describe, it, expect } from 'bun:test';
import type {
  BaseInputOptions,
  InputOptions,
  InputPrompt,
  RendererProps,
  MissingRendererPolicy,
  InputConfig,
  InputEvents,
} from '../types';

describe('types', () => {
  it('should export all type definitions', () => {
    // Type-only test to ensure all types are exported correctly
    // This test verifies that the types module can be imported without errors
    const testBaseOptions: BaseInputOptions<string> = {
      message: 'test',
      placeholder: 'placeholder',
      defaultValue: 'default',
      kind: 'text',
      required: true,
      meta: { custom: 'data' },
      abortSignal: new AbortController().signal,
      timeoutMs: 1000,
    };

    const testInputOptions: InputOptions<number> = {
      message: 'Enter number',
      defaultValue: 42,
    };

    const testPrompt: InputPrompt<string> = {
      id: 'test-id',
      message: 'test',
      resolve: (_value: string | null) => {},
    };

    const testRendererProps: RendererProps<string> = {
      prompt: testPrompt,
      queueLength: 0,
      onSubmit: (_value: string) => {},
      onCancel: () => {},
    };

    const testPolicy: MissingRendererPolicy = 'resolve-null';

    const testConfig: InputConfig = {
      renderers: {},
      defaultRenderer: 'default',
      onMissingRenderer: testPolicy,
    };

    const testEventShown: InputEvents = {
      type: 'prompt:shown',
      id: 'test',
      kind: 'text',
    };

    const testEventResolved: InputEvents = {
      type: 'prompt:resolved',
      id: 'test',
    };

    const testEventCanceled: InputEvents = {
      type: 'prompt:canceled',
      id: 'test',
      reason: 'abort',
    };

    // Verify type assignments work correctly
    expect(testBaseOptions.message).toBe('test');
    expect(testInputOptions.defaultValue).toBe(42);
    expect(testPrompt.id).toBe('test-id');
    expect(testRendererProps.queueLength).toBe(0);
    expect(testPolicy).toBe('resolve-null');
    expect(testConfig.defaultRenderer).toBe('default');
    expect(testEventShown.type).toBe('prompt:shown');
    expect(testEventResolved.type).toBe('prompt:resolved');
    expect(testEventCanceled.type).toBe('prompt:canceled');
  });

  it('should handle optional properties correctly', () => {
    const minimalOptions: InputOptions = {
      message: 'test',
    };

    const minimalPrompt: InputPrompt = {
      id: 'id',
      message: 'test',
      resolve: () => {},
    };

    const minimalConfig: InputConfig = {
      renderers: {},
      defaultRenderer: 'default',
    };

    expect(minimalOptions.message).toBe('test');
    expect(minimalPrompt.id).toBe('id');
    expect(minimalConfig.onMissingRenderer).toBeUndefined();
  });
});