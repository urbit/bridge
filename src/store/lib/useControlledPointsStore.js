import { useState, useEffect, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import Result from 'folktale/result';
import * as azimuth from 'azimuth-js';

import { useNetwork } from '../network';
import { useWallet } from 'store/wallet';
import useRoller from 'lib/useRoller';
import { isL2 } from 'lib/utils/roller';

const onlyUnique = (value, index, self) => self.indexOf(value) === index;

export default function useControlledPointsStore() {
  const { contracts } = useNetwork();
  const { wallet } = useWallet();
  const { api, getPoints } = useRoller();

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
        ownedPointsL1,
        incomingPointsL1,
        managingPointsL1,
        votingPointsL1,
        spawningPointsL1,
      ] = await Promise.all([
        getPoints('own', address),
        getPoints('transfer', address),
        getPoints('manage', address),
        getPoints('vote', address),
        getPoints('spawn', address),
        azimuth.azimuth.getOwnedPoints(_contracts, address),
        azimuth.azimuth.getTransferringFor(_contracts, address),
        azimuth.azimuth.getManagerFor(_contracts, address),
        azimuth.azimuth.getVotingFor(_contracts, address),
        azimuth.azimuth.getSpawningFor(_contracts, address),
      ]);

      console.log(1)
      const pointsWithLayers = await Promise.all(
        ownedPoints.map(async ship => {
          console.log(2)
          try {
            const pointInfo = await api.getPoint(Number(ship));
            return {
              point: Number(ship),
              layer: isL2(pointInfo?.dominion) ? 2 : 1,
            };
          } catch (error) {
            console.warn(error);
            return { point: ship, layer: 1 };
          }
        })
      );

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
              ownedPoints: ownedPoints
                .concat(ownedPointsL1)
                .map(Number)
                .filter(onlyUnique),
              incomingPoints: incomingPoints
                .concat(incomingPointsL1)
                .map(Number)
                .filter(onlyUnique),
              managingPoints: managingPoints
                .concat(managingPointsL1)
                .map(Number)
                .filter(onlyUnique),
              votingPoints: votingPoints
                .concat(votingPointsL1)
                .map(Number)
                .filter(onlyUnique),
              spawningPoints: spawningPoints
                .concat(spawningPointsL1)
                .map(Number)
                .filter(onlyUnique),
              pointsWithLayers,
            })
          )
        );
      }
    } catch (error) {
      console.error('failed to fetch controlled points', error);
      _setControlledPoints(Just(Result.Error(error)));
    }
  }, [contracts, wallet, getPoints, api]);

  // sync controlled points whenever wallet or contracts changes
  useEffect(() => {
    syncControlledPoints();
  }, [syncControlledPoints]);

  return {
    controlledPoints,
    syncControlledPoints,
  };
}
