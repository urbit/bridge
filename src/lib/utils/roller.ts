import { Just, Nothing } from 'folktale/maybe';
import { randomHex } from 'web3-utils';
import WalletConnect from '@walletconnect/client';
import RollerRPCAPI, {
  Proxy,
  Signature,
  From,
  EthAddress,
  AddressParams,
  Ship,
  SpawnParams,
  L2Data,
  PendingTransaction,
} from '@urbit/roller-api';

import { Invite } from 'lib/types/Invite';
import { signTransactionHash } from 'lib/authToken';
import { deriveNetworkKeys, CRYPTO_SUITE_VERSION } from 'lib/keys';
import { addHexPrefix } from 'lib/utils/address';
import { makeDeterministicTicket, generateWallet } from 'lib/walletgen';
import { WALLET_TYPES } from 'lib/constants';
import { L2TransactionArgs, TransactionData } from 'lib/types/L2Transaction';

export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;

export const padZero = (amount: number) =>
  `${amount < 10 && amount >= 0 ? '0' : ''}${amount}`;

export const hasPoint = (point: number) => (invite: Invite) =>
  invite.planet === point;

export const getTimeToNextBatch = (nextBatch: number, now: number) => {
  const toNext = Math.max(nextBatch - now, 0);
  const hours = Math.floor(toNext / HOUR);
  const minutes = Math.floor((toNext - hours * HOUR) / MINUTE);
  const seconds = Math.floor(
    (toNext - hours * HOUR - minutes * MINUTE) / SECOND
  );

  return `${padZero(hours)}h ${padZero(minutes)}m ${padZero(seconds)}s`;
};

export const isL2 = (dom?: string) => dom === 'l2' || dom === 'spawn';

export const isL2Spawn = (dom?: string) => dom === 'l2' || dom === 'spawn';

export const generateInviteWallet = async (point: number, seed: string) => {
  const ticket = makeDeterministicTicket(point, seed);
  const inviteWallet = await generateWallet(point, ticket, true);

  return { ticket, inviteWallet };
};

export const generateHashAndSign = async (
  api: RollerRPCAPI,
  wallet: any,
  nonce: number,
  from: From,
  type: string,
  data: any,
  walletType: symbol,
  web3: any,
  connector: WalletConnect | null
) => {
  if (walletType === WALLET_TYPES.METAMASK) {
    const hash = await api.prepareForSigning(nonce, from, type, data);
    const sig = await web3.eth.personal.sign(hash, wallet.address, '');
    return sig;
  } else if (walletType === WALLET_TYPES.WALLET_CONNECT) {
    if (!connector || !connector.connected) {
      throw new Error('Awaiting WalletConnect connection...');
    }

    const hash = await api.prepareForSigning(nonce, from, type, data);
    const sig = await connector.signPersonalMessage([hash, wallet.address]);
    return sig;
  } else {
    const hash = await api.getUnsignedTx(nonce, from, type, data);
    const sig = await signTransactionHash(hash, wallet.privateKey);
    return sig;
  }
};

export const configureKeys = async (
  api: RollerRPCAPI,
  wallet: any,
  point: Ship,
  proxy: string,
  nonce: number,
  networkSeed: any,
  walletType: symbol,
  web3: any,
  connector: WalletConnect | null,
  breach?: boolean
) => {
  const from = {
    ship: point, //ship to configure keys
    proxy,
  };

  // TODO: do something here?
  if (Nothing.hasInstance(networkSeed)) {
    console.log("Network key Error: couldn't derive network keys");
    // throw new Error("Network key Error: couldn't derive network keys");
  }

  const seed = Just.hasInstance(networkSeed)
    ? networkSeed.value
    : randomHex(32);

  const pair = deriveNetworkKeys(seed);

  const data = {
    encrypt: addHexPrefix(pair.crypt.public),
    auth: addHexPrefix(pair.auth.public),
    cryptoSuite: String(CRYPTO_SUITE_VERSION),
    breach: breach || false,
  };

  const sig = await generateHashAndSign(
    api,
    wallet,
    nonce,
    from,
    'configureKeys',
    data,
    walletType,
    web3,
    connector
  );
  return api.configureKeys(sig, from, wallet.address, data);
};

export const transferPointRequest = async (
  api: RollerRPCAPI,
  wallet: any,
  pointToTransfer: Ship,
  proxy: string,
  nonce: number,
  address: string,
  walletType: symbol,
  web3: any,
  connector: WalletConnect | null,
  reset?: boolean
) => {
  const from = {
    ship: pointToTransfer,
    proxy,
  };

  const data = {
    address,
    reset: reset || false,
  };

  const sig = await generateHashAndSign(
    api,
    wallet,
    nonce,
    from,
    'transferPoint',
    data,
    walletType,
    web3,
    connector
  );

  return api.transferPoint(sig, from, wallet.address, data);
};

const proxyType = (proxy: Proxy) => {
  switch (proxy) {
    case 'manage':
      return 'setManagementProxy';
    case 'spawn':
      return 'setSpawnProxy';
    case 'transfer':
      return 'setTransferProxy';
    default:
      throw new Error(`Unknown proxyType ${proxy}`);
  }
};

const setProxy = async (
  api: RollerRPCAPI,
  proxyAddressType: string,
  sig: Signature,
  from: From,
  address: EthAddress,
  data: AddressParams
) => {
  switch (proxyAddressType) {
    case 'manage':
      return await api.setManagementProxy(sig, from, address, data);
    case 'spawn':
      return await api.setSpawnProxy(sig, from, address, data);
    case 'transfer':
      return await api.setTransferProxy(sig, from, address, data);
    default:
      throw new Error(`Unknown proxyType ${proxyAddressType}`);
  }
};

export const registerProxyAddress = async (
  api: RollerRPCAPI,
  wallet: any,
  _point: Ship,
  proxy: string,
  proxyAddressType: string,
  nonce: number,
  address: string,
  walletType: symbol,
  web3: any,
  connector: WalletConnect | null
) => {
  const from = {
    ship: _point,
    proxy,
  };
  const data = { address };

  const sig = await generateHashAndSign(
    api,
    wallet,
    nonce,
    from,
    proxyType(proxyAddressType),
    data,
    walletType,
    web3,
    connector
  );

  return setProxy(api, proxyAddressType, sig, from, wallet.address, data);
};

const getDataAndMethod = (args: L2TransactionArgs) => {
  const {
    address,
    api,
    breach,
    networkSeed,
    reset,
    pointToSpawn,
    newSponsor,
    sponsee,
    ship,
  } = args;
  const result: TransactionData = { data: { address }, method: () => null };

  switch (args.type) {
    case 'transferPoint':
      result.method = api.transferPoint;
      result.data.reset = reset || false;
      return result;
    case 'spawn':
      result.method = api.spawn;
      result.data.ship = pointToSpawn;
      return result;
    case 'configureKeys':
      // TODO: do something here?
      if (Nothing.hasInstance(networkSeed)) {
        console.log("Network key Error: couldn't derive network keys");
        // throw new Error("Network key Error: couldn't derive network keys");
      }

      const seed = Just.hasInstance(networkSeed)
        ? networkSeed.value
        : randomHex(32);

      const pair = deriveNetworkKeys(seed);

      result.data = {
        encrypt: addHexPrefix(pair.crypt.public),
        auth: addHexPrefix(pair.auth.public),
        cryptoSuite: String(CRYPTO_SUITE_VERSION),
        breach: breach || false,
      };
      result.method = api.configureKeys;
      return result;
    case 'escape':
      result.method = api.escape;
      result.data.ship = newSponsor;
      delete result.data.address;
      return result;
    case 'cancelEscape':
      result.method = api.cancelEscape;
      result.data.ship = ship;
      delete result.data.address;
      return result;
    case 'adopt':
      result.method = api.adopt;
      result.data.ship = sponsee;
      delete result.data.address;
      return result;
    case 'detach':
      result.method = api.detach;
      result.data.ship = sponsee;
      delete result.data.address;
      return result;
    case 'reject':
      result.method = api.reject;
      result.data.ship = sponsee;
      delete result.data.address;
      return result;
  }
};

export const submitL2Transaction = async (args: L2TransactionArgs) => {
  const {
    api,
    wallet,
    ship,
    type,
    proxy,
    nonce,
    walletType,
    web3,
    connector,
  } = args;

  const from = { ship, proxy };
  const { data, method } = getDataAndMethod(args);

  const sig = await generateHashAndSign(
    api,
    wallet,
    nonce,
    from,
    type,
    data,
    walletType,
    web3,
    connector
  );

  return method(sig, from, wallet.address, data);
};

export const reticketL2Point = async () => {};

export const hasInvite = (point: number) => (invite: Invite) =>
  invite.planet === point && invite.ticket.length > 0;

function isSpawn(tx: L2Data | undefined): tx is SpawnParams {
  return (tx as SpawnParams) !== undefined;
}

function isShipNumber(ship: number | string | undefined): ship is number {
  return (ship as number) !== undefined;
}

export const getPendingSpawns = (pendingTxs: PendingTransaction[]) =>
  pendingTxs.reduce((acc, pending) => {
    return isSpawn(pending.rawTx?.tx) &&
      isShipNumber(pending.rawTx?.tx.data.ship)
      ? acc.add(pending.rawTx?.tx.data.ship!)
      : acc;
  }, new Set<number>());
