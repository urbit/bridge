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
import { includes } from 'lodash';

import { CONTRACT_ADDRESSES } from '../lib/contracts';
import { NETWORK_TYPES } from '../lib/network';
import { isDevelopment } from '../lib/flags';
import { BRIDGE_ERROR } from '../lib/error';

function _useNetwork(initialNetworkType = null) {
  const [networkType, _setNetworkType] = useState(initialNetworkType);

  const setNetworkType = networkType => {
    if (!includes(NETWORK_TYPES, networkType)) {
      throw BRIDGE_ERROR.INVALID_NETWORK_TYPE;
    }
    _setNetworkType(networkType);
  };

  const { web3, contracts } = useMemo(() => {
    // given a web3 provider and contract addresses,
    // build the web3 and contracts objects
    const initWeb3 = (provider, contractAddresses) => {
      const web3 = new Web3(provider);
      const contracts = azimuth.initContracts(web3, contractAddresses);

      return {
        web3: Maybe.Just(web3),
        contracts: Maybe.Just(contracts),
      };
    };

    switch (networkType) {
      case NETWORK_TYPES.LOCAL: {
        const protocol = isDevelopment ? 'ws' : 'wss';
        const endpoint = `${protocol}://localhost:8545`;

        return initWeb3(
          new Web3.providers.WebsocketProvider(endpoint),
          CONTRACT_ADDRESSES.DEV
        );
      }
      case NETWORK_TYPES.ROPSTEN: {
        const endpoint = `https://ropsten.infura.io/v3/${process.env.REACT_APP_INFURA_ENDPOINT}`;

        return initWeb3(
          new Web3.providers.HttpProvider(endpoint),
          CONTRACT_ADDRESSES.ROPSTEN
        );
      }
      case NETWORK_TYPES.MAINNET: {
        const endpoint = `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_ENDPOINT}`;

        return initWeb3(
          new Web3.providers.HttpProvider(endpoint),
          CONTRACT_ADDRESSES.MAINNET
        );
      }
      case NETWORK_TYPES.OFFLINE:
      default: {
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
        return {
          ...initWeb3(
            new Web3.providers.HttpProvider('http://example.com:3456'),
            isDevelopment ? CONTRACT_ADDRESSES.DEV : CONTRACT_ADDRESSES.MAINNET
          ),
          web3: Maybe.Nothing(),
          // ^ overwrite the web3 object from initWeb3 with a Maybe.Nothing
          // to indicate that there is no valid web3 connection
        };
      }
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
