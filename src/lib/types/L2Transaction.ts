import RollerRPCAPI, { EthAddress, Proxy, Ship } from '@urbit/roller-api';
import WalletConnect from '@walletconnect/client';
import BridgeWallet from './BridgeWallet';

export type TransactionType =
  | 'transferPoint'
  | 'spawn'
  | 'configureKeys'
  | 'escape'
  | 'cancelEscape'
  | 'adopt'
  | 'detach'
  | 'reject';

export interface SendL2Params {
  address?: string; // Destination address
  breach?: boolean;
  networkSeed?: any;
  newSponsor?: Ship;
  sponsee?: Ship;
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

interface ReticketProgressCallback {
  ({
    type,
    state,
    value,
  }: {
    type: string;
    state: number;
    value?: string;
  }): void;
}

export interface ReticketParams {
  point: Ship;
  to: EthAddress;
  manager: EthAddress;
  fromWallet: BridgeWallet;
  toWallet: UrbitWallet;
  onUpdate?: ReticketProgressCallback;
}
