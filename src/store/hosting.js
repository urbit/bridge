import React, { createContext, useContext, forwardRef } from 'react';

import useHostingStore from './lib/useHostingStore';

import { NETWORK_TYPES } from '../lib/network';

import { useNetwork } from 'store/network';

export const HostingContext = createContext(null);

const HOSTING_DETAILS = {
  DEV: { url: '', domain: 'liam.tlon.network', disabled: true },
  MAINNET: { url: '', domain: '', disabled: true },
};

export function HostingProvider({ children }) {
  const { networkType } = useNetwork();
  const { url, domain, disabled } =
    networkType === NETWORK_TYPES.MAINNET
      ? HOSTING_DETAILS.MAINNET
      : HOSTING_DETAILS.DEV;
  const store = useHostingStore(url, domain, disabled);
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
