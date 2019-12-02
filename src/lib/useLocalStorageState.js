import { useCallback, useState } from 'react';

/**
 * useLocalStorageState is useState but it persists to localStorage
 *
 * inspired by:
 * https://github.com/streamich/react-use/blob/master/src/useLocalStorage.ts
 * https://usehooks.com/useLocalStorage/
 */
export default function useLocalStorageState(key, initialValue) {
  const [state, _setState] = useState(() => {
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

  const setState = useCallback(
    value => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // if user is in private mode or has storage restriction
        // localStorage can throw. Also JSON.stringify can throw.
      }

      _setState(value);
    },
    [key]
  );

  return [state, setState];
}
