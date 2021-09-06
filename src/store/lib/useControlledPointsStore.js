import { useState, useEffect, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import Result from 'folktale/result';

import { useNetwork } from '../network';
import { useWallet } from 'store/wallet';
import useRoller from 'lib/useRoller';

export default function useControlledPointsStore() {
  const { contracts } = useNetwork();
  const { wallet } = useWallet();
  const { getPoints } = useRoller();

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
        getPoints('own', address),
        getPoints('transfer', address),
        getPoints('manage', address),
        getPoints('vote', address),
        getPoints('spawn', address),
      ]);

      console.log('OWNED POINTS', ownedPoints)

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
      console.error('failed to fetch controlled points', error);
      _setControlledPoints(Just(Result.Error(error)));
    }
  }, [contracts, wallet, getPoints]);

  // sync controlled points whenever wallet or contracts changes
  useEffect(() => {
    syncControlledPoints();
  }, [syncControlledPoints]);

  return {
    controlledPoints,
    syncControlledPoints,
  };
}
