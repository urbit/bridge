import { useEffect, useMemo, useState } from 'react';
import * as need from 'lib/need';
import { Just } from 'folktale/maybe';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';
import { convertToInt } from 'lib/convertToInt';

export const useHasNetworkKeysSet = () => {
  const { pointCursor }: any = usePointCursor();
  const { getDetails }: any = usePointCache();
  const point = pointCursor.getOrElse(null);
  const [networkKeysSet, setNetworkKeysSet] = useState<boolean>(true);

  useEffect(() => {
    if (point && Just.hasInstance(getDetails(point))) {
      const details = need.details(getDetails(point));
      const networkRevision = convertToInt(details.keyRevisionNumber, 10);
      setNetworkKeysSet(networkRevision > 0);
    }
  }, [getDetails, point, pointCursor]);

  return useMemo(() => {
    return networkKeysSet;
  }, [networkKeysSet]);
};
