import { useCallback, useState } from 'react';

const kEmptyObject = {};

export default function useSetState() {
  const [state, _setState] = useState(kEmptyObject);
  const setState = useCallback(
    items => _setState(state => ({ ...state, ...items })),
    [_setState]
  );

  const reset = useCallback(() => _setState(kEmptyObject), [_setState]);

  return [state, setState, reset];
}
