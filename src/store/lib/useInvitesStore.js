import { useCallback, useState } from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { useNetwork } from '../network';

// the default value of a point's invites
const EMPTY_INVITES = {
  availableInvites: Maybe.Nothing(),
  sentInvites: Maybe.Nothing(),
  acceptedInvites: Maybe.Nothing(),
};

export default function useInvitesStore() {
  const { contracts } = useNetwork();
  const [invitesCache, _setInvitesCache] = useState({});

  const addToInvitesCache = useCallback(
    entry =>
      _setInvitesCache(cache => ({
        ...cache,
        ...entry,
      })),
    [_setInvitesCache]
  );

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
      const acceptedInvites = activity.filter(i => i.active).length;

      addToInvitesCache({
        [point]: {
          availableInvites: Maybe.Just(availableInvites),
          sentInvites: Maybe.Just(sentInvites),
          acceptedInvites: Maybe.Just(acceptedInvites),
        },
      });
    },
    [contracts, addToInvitesCache]
  );

  return { getInvites, syncInvites };
}
