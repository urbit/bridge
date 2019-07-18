import { azimuth } from 'azimuth-js';

import { usePointCache } from 'store/pointCache';
import { useNetwork } from 'store/network';

import * as need from 'lib/need';

import { eqAddr, isZeroAddress } from './wallet';

const NULL_PERMISSIONS = {
  isPlanet: false,
  isStar: false,
  isGalaxy: false,
  //
  isOwner: false,
  isActiveOwner: false,
  isTransferProxy: false,
  isManagementProxy: false,
  //
  isManagementProxySet: false,
  isSpawnProxySet: false,
  isVotingProxySet: false,
  isTransferProxySet: false,
  //
  canManage: false,
  canTransfer: false,
  canSpawn: false,
  canVote: false,
  //
  spawnIsDelegatedSending: false,
};

/**
 * @param {string} address
 * @param {number} point
 */
export default function usePermissionsForPoint(address, point) {
  const { getDetails } = usePointCache();
  const { contracts } = useNetwork();

  return getDetails(point).matchWith({
    Nothing: () => NULL_PERMISSIONS,
    Just: ({ value: details }) => {
      const _contracts = need.contracts(contracts);

      const pointSize = azimuth.getPointSize(point);
      const isPlanet = pointSize === azimuth.PointSize.Planet;
      const isStar = pointSize === azimuth.PointSize.Star;
      const isGalaxy = pointSize === azimuth.PointSize.Galaxy;

      const isOwner = eqAddr(address, details.owner);
      const isActiveOwner = isOwner && details.active;
      const isManagementProxy = eqAddr(address, details.managementProxy);
      const isSpawnProxy = eqAddr(address, details.spawnProxy);
      const isVotingProxy = eqAddr(address, details.votingProxy);
      const isTransferProxy = eqAddr(address, details.transferProxy);

      const isManagementProxySet = !isZeroAddress(details.managementProxy);
      const isSpawnProxySet = !isZeroAddress(details.spawnProxy);
      const isVotingProxySet = !isZeroAddress(details.votingProxy);
      const isTransferProxySet = !isZeroAddress(details.transferProxy);

      const canManage = isOwner || isManagementProxy;
      const canTransfer = isOwner || isTransferProxy;
      const canSpawn = (isStar || isGalaxy) && (isOwner || isSpawnProxy);
      const canVote = isGalaxy && (isOwner || isVotingProxy);

      const spawnIsDelegatedSending = eqAddr(
        _contracts.delegatedSending.address,
        details.spawnProxy
      );

      return {
        isPlanet,
        isStar,
        isGalaxy,
        //
        isOwner,
        isActiveOwner,
        isTransferProxy,
        isManagementProxy,
        //
        isManagementProxySet,
        isSpawnProxySet,
        isVotingProxySet,
        isTransferProxySet,
        //
        canManage,
        canTransfer,
        canSpawn,
        canVote,
        //
        spawnIsDelegatedSending,
      };
    },
  });
}
