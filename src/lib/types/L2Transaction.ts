import RollerRPCAPI, { EthAddress, Proxy, Ship } from '@urbit/roller-api';
import WalletConnect from '@walletconnect/client';

export type TransactionType =
  | 'transferPoint'
  | 'spawn'
  | 'configureKeys'
  | 'escape';

export interface SendL2Params {
  address?: string; // Destination address
  breach?: boolean;
  networkSeed?: any;
  newSponsor?: Ship;
  nonce: number;
  pointToSpawn?: number;
  proxy: Proxy;
  proxyAddressType?: string;
  reset?: boolean;
  ship: Ship;
  type: TransactionType;
}

export interface L2TransactionArgs extends SendL2Params {
  api: RollerRPCAPI;
  wallet: any;
  walletType: symbol;
  web3: any;
  connector: WalletConnect | null;
}

export interface TransactionData {
  data: any;
  method: Function;
}

export interface ReticketParams {
  point: Ship;
  to: EthAddress;
  manager: EthAddress;
  fromWallet: any; // TODO: wallet type
  toWallet: any; // TODO: wallet type
}
