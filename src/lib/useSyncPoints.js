import { useEffect } from 'react';
import { difference } from 'lodash';

import { usePointCache } from 'store/pointCache';
import usePreviousValue from 'lib/usePreviousValue';

const buildSyncHook = getFn =>
  function SyncPoint(points = []) {
    const fn = getFn();
    const prevPoints = usePreviousValue(points);

    useEffect(() => {
      // sync points that are new between renders
      const newPoints = difference(points, prevPoints);
      Promise.all(newPoints.map(fn));
    }, [fn, prevPoints, points]);
  };

export const useSyncDates = buildSyncHook(function() {
  const { syncDates } = usePointCache();
  return syncDates;
});

export const useSyncDetails = buildSyncHook(function() {
  const { syncDetails } = usePointCache();
  return syncDetails;
});

export const useSyncExtras = buildSyncHook(function() {
  const { syncExtras } = usePointCache();
  return syncExtras;
});
