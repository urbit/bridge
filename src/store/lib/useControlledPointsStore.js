import { useState, useEffect, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import Result from 'folktale/result';
import * as azimuth from 'azimuth-js';

import { useNetwork } from '../network';
import { useWallet } from 'store/wallet';

export default function useControlledPointsStore() {
  const { contracts } = useNetwork();
  const { wallet } = useWallet();
  const [controlledPoints, _setControlledPoints] = useState(Nothing());

  const syncControlledPoints = useCallback(async () => {
    const _contracts = contracts.getOrElse(null);
    const _wallet = wallet.getOrElse(null);
    if (!_contracts || !_wallet) {
      return;
    }

    _setControlledPoints(Nothing());

    const address = _wallet.address;

    try {
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

      if (
        ownedPoints === null &&
        incomingPoints === null &&
        managingPoints === null &&
        votingPoints === null &&
        spawningPoints === null
      ) {
        _setControlledPoints(
          Just(Result.Error('Failed to read the blockchain.'))
        );
      } else {
        _setControlledPoints(
          Just(
            Result.Ok({
              ownedPoints,
              incomingPoints,
              managingPoints,
              votingPoints,
              spawningPoints,
            })
          )
        );
      }
    } catch (error) {
      _setControlledPoints(Just(Result.Error(error)));
    }
  }, [contracts, wallet]);

  // sync controlled points whenever wallet or contracts changes
  useEffect(() => {
    syncControlledPoints();
  }, [syncControlledPoints]);

  return {
    controlledPoints,
    syncControlledPoints,
  };
}
