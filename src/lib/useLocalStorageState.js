import { useState, useEffect } from 'react';

/**
 * useLocalStorageState is useState but it persists to localStorage
 *
 * inspired by:
 * https://github.com/streamich/react-use/blob/master/src/useLocalStorage.ts
 * https://usehooks.com/useLocalStorage/
 */
export default function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const value = localStorage.getItem(key);
      if (value === null) {
        localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
      } else {
        return JSON.parse(value);
      }
    } catch {
      // if user is in private mode or has storage restriction
      // localStorage can throw. JSON.parse and JSON.stringify
      // can throw, too.
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // if user is in private mode or has storage restriction
      // localStorage can throw. Also JSON.stringify can throw.
    }
  }, [key, state]);

  return [state, setState];
}
