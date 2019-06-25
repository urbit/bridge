import { useCallback, useState } from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { useNetwork } from '../network';

// the default value of a point's invites
const kEmptyInvites = {
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
    point => invitesCache[point] || kEmptyInvites,
    [invitesCache]
  );

  const syncInvites = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      if (!_contracts) {
        return;
      }

      const availableInvites = await azimuth.delegatedSending.getTotalUsableInvites(
        _contracts,
        point
      );

      const invitedPoints = await azimuth.delegatedSending.getInvited(
        _contracts,
        point
      );
      const invitedPointDetails = await Promise.all(
        invitedPoints.map(async invitedPoint => {
          console.log('invitedPoint', invitedPoint, typeof invitedPoint);
          const active = await azimuth.azimuth.isActive(
            _contracts,
            invitedPoint
          );
          return {
            point: Number(invitedPoint),
            active,
          };
        })
      );
      const sentInvites = invitedPointDetails.length;
      const acceptedInvites = invitedPointDetails.filter(i => i.active).length;

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
