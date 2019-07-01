import { useRef } from 'react';

export default function useRenderCount(debugLabel = 'Component') {
  const count = useRef(0);
  count.current++;
  console.log(`${debugLabel} — ${count.current}`);
}
