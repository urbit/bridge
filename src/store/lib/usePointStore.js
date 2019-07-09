import { useCallback } from 'react';

import useDetailsStore from './useDetailsStore';
import useBirthdaysStore from './useBirthdaysStore';
import useRekeyDateStore from './useRekeyDateStore';
import useInvitesStore from './useInvitesStore';
import useControlledPointsStore from './useControlledPointsStore';
import useEclipticOwnerStore from './useEclipticOwnerStore';
import useOptimisticPointDetailsStore from './useOptimisticDetailsStore';

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
  const optimistic = useOptimisticPointDetailsStore();

  // sync all of the on-chain info required to display a known point
  const syncKnownPoint = useCallback(
    point => {
      syncBirthday(point);
      syncRekeyDate(point);
    },
    [syncBirthday, syncRekeyDate]
  );

  // sync all of the on-chain info required to display a foreign point
  const syncForeignPoint = useCallback(point => {}, []);

  // sync all of the on-chain info required for a point that the user owns
  const syncOwnedPoint = useCallback(
    point => {
      syncForeignPoint(point);
      syncKnownPoint(point);
      //
      syncDetails(point);
      syncInvites(point);
    },
    [syncForeignPoint, syncKnownPoint, syncDetails, syncInvites]
  );

  return {
    ...details,
    ...birthdays,
    ...rekeyDates,
    ...invites,
    ...controlledPoints,
    ...ecliptic,
    ...optimistic,
    syncInvites,
    syncControlledPoints,
    syncKnownPoint,
    syncOwnedPoint,
    syncForeignPoint,
  };
}
