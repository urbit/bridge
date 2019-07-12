import { azimuth } from 'azimuth-js';

import { usePointCache } from 'store/pointCache';

import { eqAddr } from './wallet';

const NULL_PERMISSIONS = {
  isOwner: false,
  isTransferProxy: false,
  isManagementProxy: false,
  canManage: false,
  canTransfer: false,
  canSpawn: false,
  canVote: false,
};

/**
 * @param {string} address
 * @param {number} point
 */
export default function usePermissionsForPoint(address, point) {
  const { getDetails } = usePointCache();

  return getDetails(point).matchWith({
    Nothing: () => NULL_PERMISSIONS,
    Just: ({ value: details }) => {
      const pointSize = azimuth.getPointSize(point);
      const isPlanet = pointSize === azimuth.PointSize.Planet;
      const isStar = pointSize === azimuth.PointSize.Star;
      const isGalaxy = pointSize === azimuth.PointSize.Galaxy;

      const isOwner = eqAddr(address, details.owner);
      const isActiveOwner = isOwner && details.active;
      const isTransferProxy = eqAddr(address, details.transferProxy);
      const isManagementProxy = eqAddr(address, details.managementProxy);
      const isSpawnProxy = eqAddr(address, details.spawnProxy);
      const isVotingProxy = eqAddr(address, details.votingProxy);

      const canManage = isOwner || isManagementProxy;
      const canTransfer = isOwner || isTransferProxy;

      const canSpawn = (isStar || isGalaxy) && (isOwner || isSpawnProxy);
      const canVote = isGalaxy && (isOwner || isVotingProxy);

      return {
        isOwner,
        isActiveOwner,
        isTransferProxy,
        isManagementProxy,
        canManage,
        canTransfer,
        canSpawn,
        canVote,
      };
    },
  });
}
