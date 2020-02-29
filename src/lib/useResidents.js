import { useState, useCallback, useEffect } from 'react';
import { Just, Nothing } from 'folktale/maybe';

import { azimuth } from 'azimuth-js';

import { useNetwork } from 'store/network';

import useCurrentPermissions from 'lib/useCurrentPermissions';
import * as need from 'lib/need';

export function useResidents(point) {
  const [residents, setResidents] = useState(Nothing());
  const [residentCount, setResidentCount] = useState(Nothing());

  const { isParent } = useCurrentPermissions();
  const { contracts } = useNetwork();
  const _contracts = need.contracts(contracts);

  const syncResidentCount = useCallback(async () => {
    if (!isParent) {
      return;
    }
    const count = await azimuth.getSponsoringCount(_contracts, point);
    setResidentCount(Just(count.toNumber()));
  }, [isParent, setResidentCount, point, _contracts]);

  const syncResidents = useCallback(async () => {
    if (Just.hasInstance(residents) || !isParent) {
      return;
    }
    // Galaxies sponsor themselves
    const children = (await azimuth.getSponsoring(_contracts, point)).filter(
      p => p !== point
    );

    setResidents(Just(children));
  }, [residents, isParent, setResidents, point, _contracts]);

  const [requests, setRequests] = useState(Nothing);
  const syncRequests = useCallback(async () => {
    const reqs = await azimuth.getEscapeRequests(_contracts, point);
    setRequests(Just(reqs));
  }, [_contracts, point]);

  useEffect(() => {
    syncResidentCount();
  }, [syncResidentCount]);

  // useEffect(() => {
  //   syncRequests();
  // });

  return { residents, residentCount, syncResidents, requests, syncRequests };
}
