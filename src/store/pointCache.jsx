import { Just, Nothing } from 'folktale/maybe';
import Result from 'folktale/result';
import React, { createContext, forwardRef, useContext } from 'react';

import useDeepEqualReference from 'lib/useDeepEqualReference';
import usePointStore from './lib/usePointStore';

/**
 * Avoid race condition by setting an initial dummy state. Previously, on 
 * occasion the application would render before the points queries finished 
 * loading data asynchronously from the roller and Infura. This would cause
 * a crash in Points.tsx when attempting to destructure the data.
*/
const initialContext = {
  details: Nothing(),
  rekeyDates: Nothing(),
  controlledPoints: Just(Result.Error('not yet loaded')),
  ecliptic: Nothing(),
  residents: Nothing(),
  syncDetails:  () => [],
  syncRekeyDate:  () => [],
  syncControlledPoints:  () => [],
  syncDates:  () => [],
  syncResidents:  () => [],
  syncExtras:  () => [],
}

export const PointCacheContext = createContext(initialContext);

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
