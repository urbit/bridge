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
  const {
    syncControlledPoints,
    ...controlledPoints
  } = useControlledPointsStore();
  const ecliptic = useEclipticOwnerStore();

  // sync all of the on-chain info required to display a known point
  const syncKnownPoint = useCallback(
    async point => Promise.all([syncBirthday(point), syncRekeyDate(point)]),
    [syncBirthday, syncRekeyDate]
  );

  // sync all of the on-chain info required to display a foreign point
  const syncForeignPoint = useCallback(
    async point => {
      syncDetails(point);
    },
    [syncDetails]
  );

  // sync all of the on-chain info required for a point that the user owns
  const syncOwnedPoint = useCallback(
    async point =>
      Promise.all([
        syncForeignPoint(point),
        syncKnownPoint(point),
        //
        syncDetails(point),
        syncInvites(point),
      ]),
    [syncForeignPoint, syncKnownPoint, syncDetails, syncInvites]
  );

  return {
    ...details,
    ...birthdays,
    ...rekeyDates,
    ...invites,
    ...controlledPoints,
    ...ecliptic,
    syncDetails,
    syncRekeyDate,
    syncInvites,
    syncControlledPoints,
    syncKnownPoint,
    syncOwnedPoint,
    syncForeignPoint,
  };
}
