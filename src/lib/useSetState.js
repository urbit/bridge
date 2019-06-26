import { useCallback, useState } from 'react';

export default function useSetState(initialState = {}) {
  const [state, _setState] = useState(initialState);
  const setState = useCallback(
    items => _setState(state => ({ ...state, ...items })),
    [_setState]
  );

  const reset = useCallback(() => _setState(initialState), [
    _setState,
    initialState,
  ]);

  return [state, setState, reset];
}
