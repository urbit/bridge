import { useState, useCallback } from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { useNetwork } from '../network';
import { useWallet } from 'store/wallet';

const kEmptyControlledPoints = {
  ownedPoints: Maybe.Nothing(),
  incomingPoints: Maybe.Nothing(),
  managingPoints: Maybe.Nothing(),
  votingPoints: Maybe.Nothing(),
  spawningPoints: Maybe.Nothing(),
};

export default function useControlledPointsStore() {
  const { contracts } = useNetwork();
  const { wallet } = useWallet();
  const [controlledPointsCache, _setControlledPointsCache] = useState(
    kEmptyControlledPoints
  );

  const getControlledPoints = useCallback(
    () => controlledPointsCache || kEmptyControlledPoints,
    [controlledPointsCache]
  );

  const syncControlledPoints = useCallback(async () => {
    const _contracts = contracts.getOrElse(null);
    const _wallet = wallet.getOrElse(null);
    if (!_contracts || !_wallet) {
      return;
    }

    const address = _wallet.address;

    const ownedPoints = await azimuth.azimuth.getOwnedPoints(
      _contracts,
      address
    );
    const incomingPoints = await azimuth.azimuth.getTransferringFor(
      _contracts,
      address
    );
    const managingPoints = await azimuth.azimuth.getManagerFor(
      _contracts,
      address
    );
    const votingPoints = await azimuth.azimuth.getVotingFor(
      _contracts,
      address
    );
    const spawningPoints = await azimuth.azimuth.getSpawningFor(
      _contracts,
      address
    );

    _setControlledPointsCache({
      ownedPoints: Maybe.Just(ownedPoints),
      incomingPoints: Maybe.Just(incomingPoints),
      managingPoints: Maybe.Just(managingPoints),
      votingPoints: Maybe.Just(votingPoints),
      spawningPoints: Maybe.Just(spawningPoints),
    });
  }, [contracts, wallet, _setControlledPointsCache]);

  return {
    getControlledPoints,
    syncControlledPoints,
  };
}
