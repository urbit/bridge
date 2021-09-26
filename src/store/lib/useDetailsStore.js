import { useState, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import useRoller from '../../lib/useRoller';
import { useNetwork } from '../network';

const toL1Details = point => {
  return {
    dominion: 'l2',
    active: true,
    authenticationKey: point.network.keys.auth,
    continuityNumber: point.network.keys.rift,
    cryptoSuiteVersion: point.network.keys.suite,
    encryptionKey: point.network.keys.crypt,
    escapeRequested: point.network.escape ? true : false,
    escapeRequestedTo: point.network.escape,
    hasSponsor: point.network.sponsor.has,
    keyRevisionNumber: point.network.keys.life,
    managementProxy: point.ownership.managementProxy.address,
    owner: point.ownership.owner.address,
    spawnProxy: point.ownership.spawnProxy.address,
    sponsor: point.network.sponsor.who,
    transferProxy: point.ownership.transferProxy.address,
    votingProxy: point.ownership.votingProxy.address,
  };
};

export default function useDetailsStore() {
  const { contracts } = useNetwork();
  const { api } = useRoller();
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
      const l2Point = await api.getPoint(point);
      const details =
        l2Point && l2Point.dominion === 'l2'
          ? toL1Details(l2Point)
          : await azimuth.azimuth.getPoint(_contracts, point);
      addToDetails({
        [point]: details,
      });
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
