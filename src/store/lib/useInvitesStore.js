import { useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import { chain } from 'lodash';

import { useNetwork } from '../network';
import useSetState from 'lib/useSetState';

// the default value of a point's invites
const EMPTY_INVITES = {
  availableInvites: Nothing(),
  sentInvites: Nothing(),
  acceptedInvites: Nothing(),
  acceptedPoints: Nothing(),
  pendingPoints: Nothing(),
};

export default function useInvitesStore() {
  const { contracts } = useNetwork();
  const [invitesCache, addToInvitesCache] = useSetState({});

  const getInvites = useCallback(
    point => invitesCache[point] || EMPTY_INVITES,
    [invitesCache]
  );

  const syncInvites = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      if (!_contracts) {
        return;
      }

      const [availableInvites, invitedPoints] = await Promise.all([
        azimuth.delegatedSending.getTotalUsableInvites(_contracts, point),
        azimuth.delegatedSending.getInvited(_contracts, point),
      ]);

      const activity = await Promise.all(
        invitedPoints.map(invitedPoint =>
          azimuth.azimuth.isActive(_contracts, invitedPoint)
        )
      );

      const sentInvites = invitedPoints.length;
      const acceptedInvites = activity.filter(i => !!i).length;

      const [acceptedPoints, pendingPoints] = chain(invitedPoints)
        .zipWith(activity, (point, active) => ({
          point,
          active: !!active,
        }))
        .partition('active')
        .map(arr => arr.map(x => x.point));

      addToInvitesCache({
        [point]: {
          availableInvites: Just(availableInvites),
          sentInvites: Just(sentInvites),
          acceptedInvites: Just(acceptedInvites),
          pendingPoints: Just(pendingPoints),
          acceptedPoints: Just(acceptedPoints),
        },
      });
    },
    [contracts, addToInvitesCache]
  );

  return { getInvites, syncInvites };
}
