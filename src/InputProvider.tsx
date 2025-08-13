// InputProvider.tsx
import React from 'react';
import { inputManager } from './inputManager';
import type { InputPrompt } from './types';

export function InputProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = React.useState<InputPrompt<any> | null>(null);
  const [qLen, setQLen] = React.useState<number>(0);

  React.useEffect(() => {
    const unsubscribe = inputManager.subscribe(() => {
      setCurrent(inputManager.getCurrentPrompt());
      setQLen(inputManager.getQueueLength());
    });
    return unsubscribe;
  }, []);

  const submit = React.useCallback((value: unknown) => {
    if (current) inputManager.resolvePrompt(current.id, value);
  }, [current]);

  if (!current) return <>{children}</>;

  const Renderer = inputManager.getRenderer(current.kind);
  if (!Renderer) {
    console.error(`No renderer for kind: ${current.kind}`);
    inputManager.handleMissingRenderer(); // **advance queue** safely
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <Renderer
        prompt={current}
        queueLength={qLen}
        onSubmit={submit}
        onCancel={() => submit(null)}
      />
    </>
  );
}