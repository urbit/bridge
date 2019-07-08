import { useCallback } from 'react';

import useDetailsStore from './useDetailsStore';
import useBirthdaysStore from './useBirthdaysStore';
import useRekeyDateStore from './useRekeyDateStore';
import useInvitesStore from './useInvitesStore';
import useControlledPointsStore from './useControlledPointsStore';
import useEclipticOwnerStore from './useEclipticOwnerStore';

export default function usePointStore() {
  const { syncDetails, ...details } = useDetailsStore();
  const { syncBirthday, ...birthdays } = useBirthdaysStore();
  const { syncRekeyDate, ...rekeyDates } = useRekeyDateStore();
  const { syncInvites, ...invites } = useInvitesStore();
  const ecliptic = useEclipticOwnerStore();
  const {
    syncControlledPoints,
    ...controlledPoints
  } = useControlledPointsStore();

  // sync all of the on-chain info required to display a known point
  const syncKnownPoint = useCallback(
    async point => Promise.all([syncBirthday(point), syncRekeyDate(point)]),
    [syncBirthday, syncRekeyDate]
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
    ...rekeyDates,
    ...invites,
    ...controlledPoints,
    ...ecliptic,
    syncInvites,
    syncControlledPoints,
    syncKnownPoint,
    syncOwnedPoint,
    syncForeignPoint,
  };
}
