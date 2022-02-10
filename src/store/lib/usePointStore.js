import { useCallback } from 'react';

import useDetailsStore from './useDetailsStore';
import useRekeyDateStore from './useRekeyDateStore';
import useInvitesStore from './useInvitesStore';
import useControlledPointsStore from './useControlledPointsStore';
import useEclipticOwnerStore from './useEclipticOwnerStore';
import useResidents from './useResidentsStore';

export default function usePointStore() {
  const { syncDetails, ...details } = useDetailsStore();
  const { syncRekeyDate, ...rekeyDates } = useRekeyDateStore();
  const { syncInvites, ...invites } = useInvitesStore();
  const {
    syncControlledPoints,
    ...controlledPoints
  } = useControlledPointsStore();
  const { syncResidents, syncResidentCount, ...residents } = useResidents();
  const ecliptic = useEclipticOwnerStore();

  const syncDates = useCallback(
    async point => Promise.all([syncRekeyDate(point)]),
    [syncRekeyDate]
  );

  const syncExtras = useCallback(
    async point =>
      Promise.all([
        syncDetails(point),
        //
        syncDates(point),
        syncResidentCount(point),
        syncInvites(point),
      ]),
    [syncDates, syncDetails, syncInvites, syncResidentCount]
  );

  return {
    ...details,
    ...rekeyDates,
    ...invites,
    ...controlledPoints,
    ...ecliptic,
    ...residents,
    syncDetails,
    syncRekeyDate,
    syncInvites,
    syncControlledPoints,
    syncDates,
    syncResidents,
    syncExtras,
  };
}
