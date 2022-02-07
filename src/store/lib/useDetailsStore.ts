import { useState, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { isDevelopment } from 'lib/flags';
import { toL1Details } from 'lib/utils/point';
import useRoller from 'lib/useRoller';
import { useNetwork } from '../network';
import { L1Point } from 'lib/types/L1Point';

export default function useDetailsStore() {
  const { contracts }: any = useNetwork();
  const { api } = useRoller();
  const [detailsCache, _setDetailsCache] = useState<Record<number, L1Point>>(
    {}
  );

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
    point => (point in detailsCache ? Just(detailsCache[point]) : Nothing()),
    [detailsCache]
  );

  const syncDetails = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      if (!_contracts) {
        return;
      }

      // fetch point details
      try {
        const l2Point = await api.getPoint(point);
        const details =
          l2Point && (l2Point.dominion === 'l2' || l2Point.dominion === 'spawn')
            ? toL1Details(l2Point)
            : await azimuth.azimuth.getPoint(_contracts, point);
        addToDetails({
          [point]: details,
        });
      } catch (error) {
        if (isDevelopment) {
          console.warn(error);
        }

        try {
          const details = await azimuth.azimuth.getPoint(_contracts, point);
          addToDetails({
            [point]: details,
          });
        } catch (e) {
          console.warn(e);
        }
      }
    },
    [api, contracts, addToDetails]
  );

  return {
    // TODO: refactor accessors to use getDetails instead of
    // touching the cache directly
    pointCache: detailsCache,
    getDetails,
    syncDetails,
  };
}
