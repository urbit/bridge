import { useRef } from 'react';

export default function useRenderCount(debubgLabel = 'Component') {
  const count = useRef(0);
  count.current++;
  console.log(`${debubgLabel} — ${count.current}`);
}
