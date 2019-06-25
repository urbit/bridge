import { useRef } from 'react';

export default function usePreviousValue(value) {
  const prev = useRef(null);
  const curr = useRef(null);

  if (prev.current !== curr.current) {
    prev.current = curr.current;
  }

  if (curr.current !== value) {
    curr.current = value;
  }

  return prev.current;
}
