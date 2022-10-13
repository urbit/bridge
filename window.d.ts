import Buffer from 'buffer';

declare global {
  interface Window {
    buffer: Buffer
  }
}

export {};
