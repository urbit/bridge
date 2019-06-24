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
  const getBirthday = useCallback(
    point => birthdayCache[point] || Maybe.Nothing(),
    [birthdayCache]
  );
  const getInvites = useCallback(
    point => invitesCache[point] || kEmptyInvites,
    [invitesCache]
  );

  const fetchPoint = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      if (!_contracts || !_web3) {
        return;
      }

      // fetch point details
      const details = await azimuth.azimuth.getPoint(_contracts, point);
      addToPointCache({ [point]: details });

      // fetch invites
      const count = await azimuth.delegatedSending.getTotalUsableInvites(
        _contracts,
        point
      );
      addToInvitesCache({
        [point]: {
          availableInvites: Maybe.Just(count),
          // TODO: look up sent/accepted on-chain
          sentInvites: Maybe.Just(6),
          acceptedInvites: Maybe.Just(5),
        },
      });

      // fetch birthday (if not already known — will not change after being set)
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
    [
      contracts,
      web3,
      addToPointCache,
      addToBirthdayCache,
      getBirthday,
      addToInvitesCache,
    ]
  );

  return {
    pointCache,
    getBirthday,
    getInvites,
    addToPointCache,
    fetchPoint,
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
