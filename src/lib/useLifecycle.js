import { useEffect } from 'react';

// https://overreacted.io/a-complete-guide-to-useeffect/
export default function useLifecycle(fn) {
  return useEffect(fn, []);
}
