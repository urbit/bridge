import { useCallback, useState } from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import useLifecycle from './useLifecycle';

// fetch the invites available for a point
export default function useInvites(point) {
  const { contracts } = useNetwork();

  const [invites, _setInvites] = useState(Maybe.Nothing());

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
      _setInvites(Maybe.Just(count));
    })();
  }, [_setInvites, point, contracts]);

  // fetch invites on first render
  useLifecycle(fetchInvites);

  return { invites, fetchInvites };
}
