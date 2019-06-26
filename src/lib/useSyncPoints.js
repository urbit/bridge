import { useEffect } from 'react';
import { isEqual } from 'lodash';

import { usePointCache } from 'store/pointCache';
import usePreviousValue from 'lib/usePreviousValue';

// sync a known (i.e. mine) point to the cache (i.e display values)
export function useSyncKnownPoints(points = []) {
  // TBD: right now we don't need anything more than the point itself
  // but soon we'll need to know information around "key type"
}

// sync a foreign (not the user's) point to the cache
export function useSyncForeignPoints(points = []) {
  const { syncForeignPoint } = usePointCache();
  const prevPoints = usePreviousValue(points);

  useEffect(() => {
    if (!isEqual(prevPoints, points)) {
      // if the actual set of points changes, sync the whole array
      // TODO: we should get clever about caching
      points.forEach(point => syncForeignPoint(point));
    }
  }, [syncForeignPoint, prevPoints, points]);
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
