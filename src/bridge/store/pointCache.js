import React, { createContext, forwardRef, useContext, useState } from 'react';
import Maybe from 'folktale/maybe';

export const PointCacheContext = createContext(null);

function _usePointCache(initialPointCache = Maybe.Nothing()) {
  const [pointCache, _setPointCache] = useState(initialPointCache);

  const addToPointCache = entry =>
    _setPointCache(cache => ({ ...cache, entry }));

  return {
    pointCache,
    addToPointCache,
  };
}

export function PointCacheProvider({ initialPointCache, children }) {
  const pointCache = _usePointCache(initialPointCache);

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
