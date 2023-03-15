import React, { createContext, useContext } from 'react';

import useStarReleaseStore from './lib/useStarReleaseStore';

export const StarReleaseCacheContext = createContext(null);

export function StarReleaseCacheProvider({ children }) {
  const cache = useStarReleaseStore();

  return (
    <StarReleaseCacheContext.Provider value={cache}>
      {children}
    </StarReleaseCacheContext.Provider>
  );
}

// Hook version
export function useStarReleaseCache() {
  return useContext(StarReleaseCacheContext);
}
