import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useState,
} from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { useNetwork } from './network';

export const PointCacheContext = createContext(null);

// the default value of a point's invites
const kEmptyInvites = {
  availableInvites: Maybe.Nothing(),
  sentInvites: Maybe.Nothing(),
  acceptedInvites: Maybe.Nothing(),
};

// TODO(shrugs): this hook is too big -> refactor into individual hooks for
// details, birthday, invites, etc
function _usePointCache() {
  const { contracts, web3 } = useNetwork();
  const [pointCache, _setPointCache] = useState({});
  const [birthdayCache, _setBirthdayCache] = useState({});
  const [invitesCache, _setInvitesCache] = useState({});

  const addToPointCache = useCallback(
    entry => _setPointCache(cache => ({ ...cache, ...entry })),
    [_setPointCache]
  );

  const addToBirthdayCache = useCallback(
    entry => _setBirthdayCache(cache => ({ ...cache, ...entry })),
    [_setBirthdayCache]
  );

  const addToInvitesCache = useCallback(
    entry => _setInvitesCache(cache => ({ ...cache, ...entry })),
    [_setInvitesCache]
  );

  // TODO: refactor pointCache access to use accessor like bithday
  const getDetails = useCallback(
    point => pointCache[point] || Maybe.Nothing(),
    [pointCache]
  );
  const getBirthday = useCallback(
    point => birthdayCache[point] || Maybe.Nothing(),
    [birthdayCache]
  );
  const getInvites = useCallback(
    point => invitesCache[point] || kEmptyInvites,
    [invitesCache]
  );

  const syncDetails = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      if (!_contracts) {
        return;
      }

      // fetch point details
      const details = await azimuth.azimuth.getPoint(_contracts, point);
      addToPointCache({
        [point]: details,
      });
    },
    [contracts, addToPointCache]
  );

  const syncBirthday = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      if (!_contracts || !web3) {
        return;
      }

      // fetch birthday if not already known—will not change after being set
      if (Maybe.Nothing.hasInstance(getBirthday(point))) {
        const birthBlock = await azimuth.azimuth.getActivationBlock(
          _contracts,
          point
        );

        if (birthBlock > 0) {
          const block = await _web3.eth.getBlock(birthBlock);
          addToBirthdayCache({
            [point]: Maybe.Just(new Date(block.timestamp * 1000)),
          });
        }
      }
    },
    [contracts, web3, addToBirthdayCache, getBirthday]
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

  // sync all of the on-chain info required for a point that the user owns
  const syncOwnedPoint = useCallback(
    async point => {
      await Promise.all([
        syncDetails(point),
        syncInvites(point),
        syncBirthday(point),
      ]);
    },
    [syncDetails, syncInvites, syncBirthday]
  );

  return {
    pointCache,
    getDetails,
    getBirthday,
    getInvites,
    addToPointCache,
    syncOwnedPoint,
  };
}

export function PointCacheProvider({ children }) {
  const pointCache = _usePointCache();

  return (
    <PointCacheContext.Provider value={pointCache}>
      {children}
    </PointCacheContext.Provider>
  );
}

// Hook version
export function usePointCache() {
  return useContext(PointCacheContext);
}

// HOC version
export const withPointCache = Component =>
  forwardRef((props, ref) => (
    <PointCacheContext.Consumer>
      {pointCache => <Component ref={ref} {...pointCache} {...props} />}
    </PointCacheContext.Consumer>
  ));
