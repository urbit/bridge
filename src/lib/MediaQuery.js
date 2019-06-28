import React from 'react';

import { createContext, useContext } from 'react';
import useMedia from './useMedia';

// sync with //indigo/indigo/css/src/lib/_breakpoints.scss
const kBreakpoints = [
  '(min-width: 550px)', // ns
  '(min-width: 750px)', // md
  '(min-width: 960px)', // lg
];

export const MediaQueryContext = createContext(null);
// provide the index to consumers so they can easily index an array
export const MediaQueryProvider = ({ children }) => (
  <MediaQueryContext.Provider value={useMedia(kBreakpoints, [0, 1, 2], 0)}>
    {children}
  </MediaQueryContext.Provider>
);

// Hook version
export function useMediaQuery() {
  return useContext(MediaQueryContext);
}
