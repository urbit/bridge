import Buffer from 'buffer';

declare global {
  interface Window {
    Buffer: Buffer
  }
}

export {};
