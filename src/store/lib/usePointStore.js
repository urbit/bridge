import { useCallback } from 'react';

import useDetailsStore from './useDetailsStore';
import useRekeyDateStore from './useRekeyDateStore';
import useControlledPointsStore from './useControlledPointsStore';
import useEclipticOwnerStore from './useEclipticOwnerStore';
import useResidents from './useResidentsStore';

export default function usePointStore() {
  const { syncDetails, ...details } = useDetailsStore();
  const { syncRekeyDate, ...rekeyDates } = useRekeyDateStore();
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
        syncDates(point),
        syncResidentCount(point),
      ]),
    [syncDates, syncDetails, syncResidentCount]
  );

  return {
    ...details,
    ...rekeyDates,
    ...controlledPoints,
    ...ecliptic,
    ...residents,
    syncDetails,
    syncRekeyDate,
    syncControlledPoints,
    syncDates,
    syncResidents,
    syncExtras,
  };
}
