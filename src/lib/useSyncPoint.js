import { useEffect } from 'react';

import { usePointCache } from 'store/pointCache';

// sync a specified point to the cache
export default function useSyncPoint(point) {
  const { fetchPoint } = usePointCache();

  useEffect(() => {
    fetchPoint(point);
  }, [fetchPoint, point]);
}
