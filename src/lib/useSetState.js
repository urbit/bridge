import { useCallback, useRef, useState } from 'react';

export default function useSetState(initialState = {}) {
  const initialStateRef = useRef(initialState);
  const [state, _setState] = useState(initialState);
  const setState = useCallback(
    items => _setState(state => ({ ...state, ...items })),
    [_setState]
  );

  const reset = useCallback(() => _setState(initialStateRef.current), [
    _setState,
  ]);

  return [state, setState, reset];
}
