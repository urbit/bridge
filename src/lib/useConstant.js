import { useRef } from 'react';

// inspired by, but simpler version of:
// https://github.com/Andarist/use-constant/blob/master/src/index.ts
export default function useConstant(fn) {
  const ref = useRef();

  if (!ref.current) {
    ref.current = fn();
  }

  return ref.current;
}
