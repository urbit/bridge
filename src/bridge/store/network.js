import React, {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
} from 'react';
import * as azimuth from 'azimuth-js';
import Web3 from 'web3';
import Maybe from 'folktale/maybe';

import { CONTRACT_ADDRESSES } from '../lib/contracts';
import { NETWORK_TYPES } from '../lib/network';
import { isDevelopment } from '../lib/flags';

function _useNetwork(initialNetworkType = null) {
  const [networkType, setNetworkType] = useState(initialNetworkType);

  const { web3, contracts } = useMemo(() => {
    if (networkType === NETWORK_TYPES.LOCAL) {
      const protocol = isDevelopment ? 'ws' : 'wss';
      const endpoint = `${protocol}://localhost:8545`;
      const provider = new Web3.providers.WebsocketProvider(endpoint);
      const web3 = new Web3(provider);
      const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.DEV);

      return { web3: Maybe.Just(web3), contracts: Maybe.Just(contracts) };
    }

    if (networkType === NETWORK_TYPES.ROPSTEN) {
      const endpoint = `https://ropsten.infura.io/v3/${process.env.REACT_APP_INFURA_ENDPOINT}`;

      const provider = new Web3.providers.HttpProvider(endpoint);
      const web3 = new Web3(provider);
      const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.ROPSTEN);

      return { web3: Maybe.Just(web3), contracts: Maybe.Just(contracts) };
    }

    if (networkType === NETWORK_TYPES.MAINNET) {
      const endpoint = `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_ENDPOINT}`;

      const provider = new Web3.providers.HttpProvider(endpoint);
      const web3 = new Web3(provider);
      const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.MAINNET);

      return { web3: Maybe.Just(web3), contracts: Maybe.Just(contracts) };
    }

    if (networkType === NETWORK_TYPES.OFFLINE) {
      // NB (jtobin):
      //
      // The 'offline' network type targets the mainnet contracts, but does not
      // actually use a provider to connect.  We use a web3 instance to
      // initalise the contracts, but the network itself is set to Nothing.
      //
      // We may want to offer the ability to select a target network for
      // transactions when offline.

      // Note: example.com:3456 doesn't actually point to anything, we just need
      // a provider to initialize the Web3 object
      const provider = new Web3.providers.HttpProvider(
        'http://example.com:3456'
      );
      const web3 = new Web3(provider);

      const target = isDevelopment
        ? CONTRACT_ADDRESSES.DEV
        : CONTRACT_ADDRESSES.MAINNET;

      const contracts = azimuth.initContracts(web3, target);

      return { web3: Maybe.Nothing(), contracts: Maybe.Just(contracts) };
    }
  }, [networkType]);

  return { networkType, setNetworkType, web3, contracts };
}

const NetworkContext = createContext(null);

// provider
export function NetworkProvider({ initialNetworkType, children }) {
  const value = _useNetwork(initialNetworkType);
  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

// hook consumer
export function useNetwork() {
  return useContext(NetworkContext);
}

// hoc consumer
export const withNetwork = Component =>
  forwardRef((props, ref) => {
    return (
      <NetworkContext.Consumer>
        {value => <Component ref={ref} {...value} {...props} />}
      </NetworkContext.Consumer>
    );
  });
