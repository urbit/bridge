import { useState, useCallback } from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { useNetwork } from '../network';
import { useWallet } from 'store/wallet';

const EMPTY_CONTROLLED_POINTS = {
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
    EMPTY_CONTROLLED_POINTS
  );

  const getControlledPoints = useCallback(
    () => controlledPointsCache || EMPTY_CONTROLLED_POINTS,
    [controlledPointsCache]
  );

  const syncControlledPoints = useCallback(async () => {
    const _contracts = contracts.getOrElse(null);
    const _wallet = wallet.getOrElse(null);
    if (!_contracts || !_wallet) {
      return;
    }

    const address = _wallet.address;

    const [
      ownedPoints,
      incomingPoints,
      managingPoints,
      votingPoints,
      spawningPoints,
    ] = await Promise.all([
      azimuth.azimuth.getOwnedPoints(_contracts, address),
      azimuth.azimuth.getTransferringFor(_contracts, address),
      azimuth.azimuth.getManagerFor(_contracts, address),
      azimuth.azimuth.getVotingFor(_contracts, address),
      azimuth.azimuth.getSpawningFor(_contracts, address),
    ]);

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
