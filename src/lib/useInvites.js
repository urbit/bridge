import { useCallback, useState } from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import useLifecycle from './useLifecycle';

// fetch the invites available for a point
export default function useInvites(point) {
  const { contracts } = useNetwork();

  const [availableInvites, _setAvailableInvites] = useState(Maybe.Nothing());

  const fetchInvites = useCallback(() => {
    const _contracts = contracts.getOrElse(null);

    if (!contracts) {
      return;
    }

    (async () => {
      const count = await azimuth.delegatedSending.getTotalUsableInvites(
        _contracts,
        point
      );
      _setAvailableInvites(Maybe.Just(count));
    })();
  }, [_setAvailableInvites, point, contracts]);

  // fetch invites on first render
  useLifecycle(fetchInvites);

  return {
    availableInvites,
    fetchInvites,
    // TODO: look up sent/accepted
    sentInvites: Maybe.Just(6),
    acceptedInvites: Maybe.Just(5),
  };
}
