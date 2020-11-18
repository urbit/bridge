import React, {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import Web3 from 'web3';
import { includes } from 'lodash';

import { CONTRACT_ADDRESSES } from '../lib/contracts';
import { NETWORK_TYPES, chainIdToNetworkType } from '../lib/network';
import { isDevelopment } from '../lib/flags';
import { BRIDGE_ERROR } from '../lib/error';

function _useNetwork(initialNetworkType = null) {
  const [networkType, setNetworkType] = useState(initialNetworkType);

  const [metamask, setMetamask] = useState(false);

  useEffect(() => {
    (async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.enable();
          setMetamask(true);
          setNetworkType(chainIdToNetworkType(window.ethereum.chainId));
        } catch (e) {
          console.log('Metamask denied');
        }
      }
    })();
  }, []);

  const { web3, contracts } = useMemo(() => {
    // given a web3 provider and contract addresses,
    // build the web3 and contracts objects
    const initWeb3 = (provider, contractAddresses) => {
      // use an in-window eth provider if possible
      const _provider = metamask ? window.ethereum : provider;
      const web3 = new Web3(_provider);
      const contracts = azimuth.initContracts(web3, contractAddresses);

      return {
        web3: Just(web3),
        contracts: Just(contracts),
      };
    };

    switch (networkType) {
      case NETWORK_TYPES.LOCAL: {
        const protocol = isDevelopment ? 'ws' : 'wss';
        const endpoint = `${protocol}://${document.location.hostname}:8545`;

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
      case NETWORK_TYPES.RINKEBY: {
        const endpoint = `https://rinkeby.infura.io/v3/${process.env.REACT_APP_INFURA_ENDPOINT}`;
        return initWeb3(
          new Web3.providers.HttpProvider(endpoint),
          CONTRACT_ADDRESSES.RINKEBY
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
          web3: Nothing(),
          // ^ overwrite the web3 object from initWeb3 with a Nothing
          // to indicate that there is no valid web3 connection
        };
      }
    }
  }, [networkType, metamask]);

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
