import { useEffect } from 'react';

// https://overreacted.io/a-complete-guide-to-useeffect/
export default function useLifecycle(fn) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useEffect(fn, []);
}
