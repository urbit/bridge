import { useCallback } from 'react';

import useDetailsStore from './useDetailsStore';
import useBirthdaysStore from './useBirthdaysStore';
import useRekeyDateStore from './useRekeyDateStore';
import useInvitesStore from './useInvitesStore';
import useClaimsStore from './useClaimsStore';
import useControlledPointsStore from './useControlledPointsStore';
import useEclipticOwnerStore from './useEclipticOwnerStore';
import useResidents from './useResidentsStore';

export default function usePointStore() {
  const { syncDetails, ...details } = useDetailsStore();
  const { syncBirthday, ...birthdays } = useBirthdaysStore();
  const { syncRekeyDate, ...rekeyDates } = useRekeyDateStore();
  const { syncInvites, ...invites } = useInvitesStore();
  const { syncClaims, ...claims } = useClaimsStore();
  const {
    syncControlledPoints,
    ...controlledPoints
  } = useControlledPointsStore();
  const { syncResidents, syncResidentCount, ...residents } = useResidents();
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
        syncResidentCount(point),
        syncDetails(point),
        syncInvites(point),
        syncClaims(point),
      ]),
    [
      syncForeignPoint,
      syncKnownPoint,
      syncDetails,
      syncInvites,
      syncClaims,
      syncResidentCount,
    ]
  );

  return {
    ...details,
    ...birthdays,
    ...rekeyDates,
    ...invites,
    ...claims,
    ...controlledPoints,
    ...ecliptic,
    ...residents,
    syncDetails,
    syncRekeyDate,
    syncInvites,
    syncClaims,
    syncControlledPoints,
    syncKnownPoint,
    syncOwnedPoint,
    syncForeignPoint,
    syncResidents,
  };
}
