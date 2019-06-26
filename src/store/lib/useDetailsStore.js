import { useState, useCallback } from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { useNetwork } from '../network';

export default function useDetailsStore() {
  const { contracts } = useNetwork();
  const [detailsCache, _setDetailsCache] = useState({});

  const addToDetails = useCallback(
    entry =>
      _setDetailsCache(cache => ({
        ...cache,
        ...entry,
      })),
    [_setDetailsCache]
  );

  // TODO: refactor detailsCache access to use accessor like bithday
  // Maybe<{}>
  const getDetails = useCallback(
    point =>
      point in detailsCache ? Maybe.Just(detailsCache[point]) : Maybe.Nothing(),
    [detailsCache]
  );

  const syncDetails = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      if (!_contracts) {
        return;
      }

      // fetch point details
      const details = await azimuth.azimuth.getPoint(_contracts, point);
      addToDetails({
        [point]: details,
      });
    },
    [contracts, addToDetails]
  );

  return {
    // TODO: refactor accessors to use getDetails instead of
    // touching the cache directly
    pointCache: detailsCache,
    getDetails,
    syncDetails,
  };
}
