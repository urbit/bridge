import { Buffer } from 'buffer/';
(self as any).Buffer = Buffer;

export const walletgenWorker = new ComlinkWorker<typeof import('./worker')>(
  new URL('./worker.ts', import.meta.url)
);
