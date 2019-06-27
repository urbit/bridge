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

export const useSyncKnownPoints = buildSyncHook(function() {
  const { syncKnownPoint } = usePointCache();
  return syncKnownPoint;
});

export const useSyncForeignPoints = buildSyncHook(function() {
  const { syncForeignPoint } = usePointCache();
  return syncForeignPoint;
});

export const useSyncOwnedPoints = buildSyncHook(function() {
  const { syncOwnedPoint } = usePointCache();
  return syncOwnedPoint;
});
