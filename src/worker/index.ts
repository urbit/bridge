import { Buffer } from 'buffer/';
// eslint-disable-next-line
(self as any).Buffer = Buffer;

export const walletgenWorker = new ComlinkWorker<typeof import('./worker')>(
  new URL('./worker.ts', import.meta.url)
);
