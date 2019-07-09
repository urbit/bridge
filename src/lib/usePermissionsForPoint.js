import { eqAddr } from './wallet';
import { usePointCache } from 'store/pointCache';

const NULL_PERMISSIONS = {
  isOwner: false,
  isTransferProxy: false,
  isManagementProxy: false,
  canTransfer: false,
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
      const isOwner = eqAddr(address, details.owner);
      const isTransferProxy = eqAddr(address, details.transferProxy);
      const isManagementProxy = eqAddr(address, details.managementProxy);
      const canTransfer = isOwner || isTransferProxy;

      return { isOwner, isTransferProxy, isManagementProxy, canTransfer };
    },
  });
}
