import React, { createContext, forwardRef, useContext, useState } from 'react';

export const PointCacheContext = createContext(null);

function _usePointCache() {
  const [pointCache, _setPointCache] = useState({});

  const addToPointCache = entry =>
    _setPointCache(cache => ({ ...cache, entry }));

  return {
    pointCache,
    addToPointCache,
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
