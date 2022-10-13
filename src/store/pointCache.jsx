import React, { createContext, forwardRef, useContext } from 'react';

import useDeepEqualReference from 'lib/useDeepEqualReference';
import usePointStore from './lib/usePointStore';

export const PointCacheContext = createContext(null);

export function PointCacheProvider({ children }) {
  const cache = usePointStore();

  return (
    <PointCacheContext.Provider value={useDeepEqualReference(cache)}>
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
      {cache => <Component ref={ref} {...cache} {...props} />}
    </PointCacheContext.Consumer>
  ));
