import { useEffect, useMemo, useState } from 'react';
import * as need from 'lib/need';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';
import { useRollerStore } from 'store/roller';
import { convertToInt } from 'lib/convertToInt';
import { isPlanet } from 'lib/utils/point';

export const useHasNetworkKeysSet = () => {
  const { pointCursor } = usePointCursor();
  const { getDetails } = usePointCache();
  const { currentL2 } = useRollerStore();
  const point = pointCursor.getOrElse(null);
  const [networkKeysSet, setNetworkKeysSet] = useState<boolean>(true);

  useEffect(() => {
    if (point) {
      const details = need.details(getDetails(point));
      const isStarOrGalaxy = !isPlanet(point);
      const networkRevision = convertToInt(details.keyRevisionNumber, 10);
      const networkKeysNotSet =
        !currentL2 && isStarOrGalaxy && networkRevision === 0;
      setNetworkKeysSet(!networkKeysNotSet);
    }
  }, [currentL2, getDetails, point, pointCursor]);

  return useMemo(() => {
    return networkKeysSet;
  }, [networkKeysSet]);
};
