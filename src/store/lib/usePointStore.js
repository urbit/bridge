import { useCallback } from 'react';

import useDetailsStore from './useDetailsStore';
import useBirthdaysStore from './useBirthdaysStore';
import useInvitesStore from './useInvitesStore';
import useControlledPointsStore from './useControlledPointsStore';
import useEclipticOwnerStore from './useEclipticOwnerStore';

export default function usePointStore() {
  const { syncDetails, ...details } = useDetailsStore();
  const { syncBirthday, ...birthdays } = useBirthdaysStore();
  const { syncInvites, ...invites } = useInvitesStore();
  const ecliptic = useEclipticOwnerStore();
  const {
    syncControlledPoints,
    ...controlledPoints
  } = useControlledPointsStore();

  // sync all of the on-chain info required to display a foreign point
  const syncForeignPoint = useCallback(async point => Promise.all([]), []);

  // sync all of the on-chain info required for a point that the user owns
  const syncOwnedPoint = useCallback(
    async point =>
      Promise.all([
        syncDetails(point),
        syncBirthday(point),
        syncInvites(point),
      ]),
    [syncDetails, syncBirthday, syncInvites]
  );

  return {
    ...details,
    ...birthdays,
    ...invites,
    ...controlledPoints,
    ...ecliptic,
    syncInvites,
    syncControlledPoints,
    syncOwnedPoint,
    syncForeignPoint,
  };
}
