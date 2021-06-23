import { azimuth } from 'azimuth-js';

import { usePointCache } from 'store/pointCache';
import { useNetwork } from 'store/network';

import * as need from 'lib/need';

import { eqAddr, isZeroAddress } from './utils/crypto';

const NULL_PERMISSIONS = {
  isActive: false,
  //
  isOwner: false,
  isActiveOwner: false,
  isManagementProxy: false,
  isSpawnProxy: false,
  isVotingProxy: false,
  isTransferProxy: false,
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

  const pointSize = azimuth.getPointSize(point);
  const isPlanet = pointSize === azimuth.PointSize.Planet;
  const isStar = pointSize === azimuth.PointSize.Star;
  const isGalaxy = pointSize === azimuth.PointSize.Galaxy;
  const isParent = isStar || isGalaxy;
  const staticPermissions = { isPlanet, isStar, isGalaxy, isParent };

  return {
    ...staticPermissions,
    ...getDetails(point).matchWith({
      Nothing: () => NULL_PERMISSIONS,
      Just: ({ value: details }) => {
        const _contracts = need.contracts(contracts);

        const isActive = details.active;

        const isOwner = eqAddr(address, details.owner);
        const isActiveOwner = isOwner && isActive;
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
        const canSpawn =
          isParent &&
          (isOwner || isSpawnProxy) &&
          details.keyRevisionNumber > 0;
        const canVote = isGalaxy && isActive && (isOwner || isVotingProxy);

        const spawnIsDelegatedSending = eqAddr(
          _contracts.delegatedSending.address,
          details.spawnProxy
        );

        return {
          isActive,
          //
          isOwner,
          isActiveOwner,
          isManagementProxy,
          isSpawnProxy,
          isVotingProxy,
          isTransferProxy,
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
    }),
  };
}
