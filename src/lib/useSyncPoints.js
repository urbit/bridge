import { useEffect } from 'react';
import { isEqual } from 'lodash';

import { usePointCache } from 'store/pointCache';
import usePreviousValue from 'lib/usePreviousValue';

// sync a known point to the cache (i.e display values)
export function useSyncKnownPoints(points = []) {
  //
}

// sync an owned point to the cache
export function useSyncOwnedPoints(points = []) {
  const { syncOwnedPoint } = usePointCache();
  const prevPoints = usePreviousValue(points);

  useEffect(() => {
    if (!isEqual(prevPoints, points)) {
      // if the actual set of points changes, sync the whole array
      // TODO: we should get clever about caching
      points.forEach(point => syncOwnedPoint(point));
    }
  }, [syncOwnedPoint, prevPoints, points]);
}
