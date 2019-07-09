import { useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';

import useSetState from 'lib/useSetState';

const DEFAULT_OPTIMISTIC_DETAILS = {
  keyRevisionNumber: Nothing(),
};

export default function useOptimisticDetailsStore() {
  const [optimisticDetails, addToOptimisticDetails] = useSetState({});

  const getOptimisticDetails = useCallback(
    point => optimisticDetails[point] || DEFAULT_OPTIMISTIC_DETAILS,
    [optimisticDetails]
  );

  const _buildSetter = key =>
    useCallback(
      (point, value) =>
        addToOptimisticDetails({
          [point]: {
            ...DEFAULT_OPTIMISTIC_DETAILS,
            ...optimisticDetails[point],
            ...optimisticDetails({ [key]: Just(value) }),
          },
        }),
      // NOTE: this usage of useCallback is ok because it is called a constant
      // number of times. the linter also doesn't understand that it's within
      // a closure, so we disable the rule here.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [addToOptimisticDetails, optimisticDetails]
    );

  const setOptimisticKeyRevision = _buildSetter('keyRevisionNumber');

  return { getOptimisticDetails, setOptimisticKeyRevision };
}
