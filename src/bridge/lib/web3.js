import * as azimuth from "azimuth-js";
import Web3 from "web3";

import { CONTRACT_ADDRESSES } from "./contracts";
import { NETWORK_NAMES } from "./network";

export const initWeb3 = networkType => {
  if (networkType === NETWORK_NAMES.MAINNET) {
    const endpoint = `https://mainnet.infura.io/v3/${
      process.env.REACT_APP_INFURA_ENDPOINT
    }`;

    const provider = new Web3.providers.HttpProvider(endpoint);
    const web3 = new Web3(provider);
    const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.MAINNET);
    return { web3: web3, contracts: contracts };
  } else if (networkType === NETWORK_NAMES.LOCAL) {
    const protocol = process.env.NODE_ENV === "development" ? "ws" : "wss";
    const endpoint = `${protocol}://localhost:8545`;
    const provider = new Web3.providers.WebsocketProvider(endpoint);
    const web3 = new Web3(provider);
    const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.DEV);
    return { web3: web3, contracts: contracts };
  }
};
