import { useCallback } from 'react';

import useLocalStorageState from './useLocalStorageState';

const REJECTED_POINTS_KEY = 'bridge:rejected-points';

export default function useRejectedIncomingPointTransfers() {
  const [rejectedPoints, setRejectedPoints] = useLocalStorageState(
    REJECTED_POINTS_KEY,
    []
  );

  const addRejectedPoint = useCallback(
    point => setRejectedPoints([...rejectedPoints, point]),
    [rejectedPoints, setRejectedPoints]
  );

  return [rejectedPoints, addRejectedPoint];
}
