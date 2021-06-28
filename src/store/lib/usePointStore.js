import { useCallback } from 'react';

import useDetailsStore from './useDetailsStore';
import useBirthdaysStore from './useBirthdaysStore';
import useRekeyDateStore from './useRekeyDateStore';
import useInvitesStore from './useInvitesStore';
import useControlledPointsStore from './useControlledPointsStore';
import useEclipticOwnerStore from './useEclipticOwnerStore';
import useResidents from './useResidentsStore';

export default function usePointStore() {
  const { syncDetails, ...details } = useDetailsStore();
  const { syncBirthday, ...birthdays } = useBirthdaysStore();
  const { syncRekeyDate, ...rekeyDates } = useRekeyDateStore();
  const { syncInvites, ...invites } = useInvitesStore();
  const {
    syncControlledPoints,
    ...controlledPoints
  } = useControlledPointsStore();
  const { syncResidents, syncResidentCount, ...residents } = useResidents();
  const ecliptic = useEclipticOwnerStore();

  const syncDates = useCallback(
    async point => Promise.all([syncBirthday(point), syncRekeyDate(point)]),
    [syncBirthday, syncRekeyDate]
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
    ...birthdays,
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
