import { useEffect } from 'react';

import { usePointCache } from 'store/pointCache';

// sync a specified point to the cache
export default function useSyncPoint(point) {
  const { syncOwnedPoint } = usePointCache();

  useEffect(() => {
    syncOwnedPoint(point);
  }, [syncOwnedPoint, point]);
}
