import { useState, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';

import { azimuth } from 'azimuth-js';

import { useNetwork } from 'store/network';

import * as need from 'lib/need';

const emptyCacheEntry = {
  residentCount: Nothing(),
  requestCount: Nothing(),
  residents: Nothing(),
  requests: Nothing(),
};

export default function useResidents() {
  const [residentCache, _setResidentCache] = useState({});

  const addToResidentCache = useCallback(
    (point, entry) =>
      _setResidentCache(cache => ({ ...cache, [point]: entry })),
    [_setResidentCache]
  );

  const getResidents = useCallback(
    point => residentCache[point] || emptyCacheEntry,
    [residentCache]
  );

  const { contracts } = useNetwork();
  const _contracts = need.contracts(contracts);

  const syncResidentCount = useCallback(
    async point => {
      // Do nothing if we've already fetched in full
      // or we aren't a sponsor
      const pointSize = azimuth.getPointSize(point);
      if (Just.hasInstance(getResidents(point).residents)) {
        return;
      }
      if (pointSize === azimuth.PointSize.Planet) {
        addToResidentCache(point, {
          residentCount: Just(0),
          requestCount: Just(0),
          requests: Just([]),
          residents: Just([]),
        });
        return;
      }

      const isGalaxy = pointSize === azimuth.PointSize.Galaxy;
      const [residentCount, requestCount] = await Promise.all([
        azimuth.getSponsoringCount(_contracts, point),
        azimuth.getEscapeRequestsCount(_contracts, point),
      ]);

      // Galaxies sponsor themselves
      const parsedCount = Number(residentCount);
      const _residentCount = isGalaxy ? parsedCount - 1 : parsedCount;

      addToResidentCache(point, {
        residentCount: Just(_residentCount),
        requestCount: Just(Number(requestCount)),
        residents: Nothing(),
        requests: Nothing(),
      });
    },
    [addToResidentCache, _contracts, getResidents]
  );

  const syncResidents = useCallback(
    async point => {
      if (azimuth.getPointSize(point) === azimuth.PointSize.Planet) {
        addToResidentCache(point, {
          residentCount: Just(0),
          requestCount: Just(0),
          requests: Just([]),
          residents: Just([]),
        });

        return;
      }
      const [residents, requests] = await Promise.all([
        azimuth.getSponsoring(_contracts, point),
        azimuth.getEscapeRequests(_contracts, point),
      ]);

      // Galaxies sponsor themselves
      const _residents = residents.filter(r => r !== point);

      addToResidentCache(point, {
        residentCount: Just(_residents.length),
        requestCount: Just(requests.length),
        residents: Just(_residents),
        requests: Just(requests),
      });
    },
    [addToResidentCache, _contracts]
  );

  return { getResidents, syncResidentCount, syncResidents };
}
