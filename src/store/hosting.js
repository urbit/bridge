import React, { createContext, useContext, forwardRef } from 'react';

import useHostingStore from './lib/useHostingStore';

export const HostingContext = createContext(null);

export function HostingProvider({ children }) {
  const store = useHostingStore();
  return (
    <HostingContext.Provider value={store}>{children}</HostingContext.Provider>
  );
}

export function useHosting() {
  return useContext(HostingContext);
}

export const withHosting = Component =>
  forwardRef((props, ref) => (
    <HostingContext.Consumer>
      {store => <Component ref={ref} {...store} {...props} />}
    </HostingContext.Consumer>
  ));
