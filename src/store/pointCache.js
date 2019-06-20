import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useState,
} from 'react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from './network';

export const PointCacheContext = createContext(null);

function _usePointCache() {
  const { contracts } = useNetwork();
  const [pointCache, _setPointCache] = useState({});

  const addToPointCache = useCallback(
    entry => _setPointCache(cache => ({ ...cache, ...entry })),
    [_setPointCache]
  );

  const fetchPoint = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      if (!_contracts) {
        return;
      }

      const details = await azimuth.azimuth.getPoint(_contracts, point);
      addToPointCache({ [point]: details });
    },
    [contracts, addToPointCache]
  );

  return {
    pointCache,
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
