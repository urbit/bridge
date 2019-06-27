import { useCallback } from 'react';

import useDetailsStore from './useDetailsStore';
import useBirthdaysStore from './useBirthdaysStore';
import useInvitesStore from './useInvitesStore';
import useControlledPointsStore from './useControlledPointsStore';

export default function usePointStore() {
  const { syncDetails, ...details } = useDetailsStore();
  const { syncBirthday, ...birthdays } = useBirthdaysStore();
  const { syncInvites, ...invites } = useInvitesStore();
  const {
    syncControlledPoints,
    ...controlledPoints
  } = useControlledPointsStore();

  // sync all of the on-chain info required to display a known point
  const syncKnownPoint = useCallback(
    async point => Promise.all([syncBirthday(point)]),
    [syncBirthday]
  );

  // sync all of the on-chain info required to display a foreign point
  const syncForeignPoint = useCallback(async point => Promise.all([]), []);

  // sync all of the on-chain info required for a point that the user owns
  const syncOwnedPoint = useCallback(
    async point =>
      Promise.all([
        syncKnownPoint(point),
        syncDetails(point),
        syncInvites(point),
      ]),
    [syncKnownPoint, syncDetails, syncInvites]
  );

  return {
    ...details,
    ...birthdays,
    ...invites,
    ...controlledPoints,
    syncInvites,
    syncControlledPoints,
    syncKnownPoint,
    syncOwnedPoint,
    syncForeignPoint,
  };
}
