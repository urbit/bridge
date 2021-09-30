import { Just, Nothing } from 'folktale/maybe';
import { Invite } from 'lib/types/Invite';
import { signTransactionHash } from 'lib/authToken';
import { randomHex } from 'web3-utils';

import RollerRPCAPI, {
  Proxy,
  Signature,
  From,
  EthAddress,
  AddressParams,
  Ship,
} from '@urbit/roller-api';

import { deriveNetworkKeys, CRYPTO_SUITE_VERSION } from 'lib/keys';
import { addHexPrefix } from 'lib/utils/address';
import { makeDeterministicTicket, generateWallet } from 'lib/walletgen';

export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;

export const padZero = (amount: number) =>
  `${amount < 10 && amount > 0 ? '0' : ''}${amount}`;

export const hasPoint = (point: number) => (invite: Invite) =>
  invite.planet === point;

export const getTimeToNextBatch = (nextBatch: number, now: number) => {
  const toNext = nextBatch - now;
  const hours = Math.floor(toNext / HOUR);
  const minutes = Math.floor((toNext - hours * HOUR) / MINUTE);
  const seconds = Math.floor(
    (toNext - hours * HOUR - minutes * MINUTE) / SECOND
  );

  return `${padZero(hours)}h ${padZero(minutes)}m ${padZero(seconds)}s`;
};

export const isL2 = (dom?: string) => dom === 'l2' || dom === 'spawn';

export const isL2Spawn = (dom?: string) => dom === 'spawn';

export const generateInviteWallet = async (point: number, seed: string) => {
  const ticket = makeDeterministicTicket(point, seed);
  const inviteWallet = await generateWallet(point, ticket, true);

  return { ticket, inviteWallet };
};

export const spawn = async (
  api: RollerRPCAPI,
  _wallet: any,
  _point: number,
  proxy: string,
  nonce: number,
  planet: number
) => {
  const from = {
    ship: _point, //ship that is spawning the planet
    proxy,
  };

  const data = {
    address: _wallet.address,
    ship: planet, // ship to spawn
  };

  const hash = await api.hashTransaction(nonce, from, 'spawn', data);
  const sSig = signTransactionHash(hash, _wallet.privateKey);
  return api.spawn(sSig, from, _wallet.address, data);
};

export const configureKeys = async (
  api: RollerRPCAPI,
  wallet: any,
  point: Ship,
  proxy: string,
  nonce: number,
  networkSeed: any,
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

  const hash = await api.hashTransaction(nonce, from, 'configureKeys', data);
  const sig = signTransactionHash(hash, wallet.privateKey);
  return api.configureKeys(sig, from, wallet.address, data);
};

export const transferPointRequest = async (
  api: RollerRPCAPI,
  _wallet: any,
  _point: Ship,
  planet: number,
  proxy: string,
  nonce: number,
  address: string,
  reset?: boolean
) => {
  const from = {
    ship: planet, //planet to transfer
    proxy,
  };

  const data = {
    address,
    reset: reset || false,
  };
  const hash = await api.hashTransaction(nonce, from, 'transferPoint', data);
  const sig = signTransactionHash(hash, _wallet.privateKey);
  return api.transferPoint(sig, from, _wallet.address, data);
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
  _wallet: any,
  _point: Ship,
  proxy: string,
  proxyAddressType: string,
  nonce: number,
  address: string
) => {
  const from = {
    ship: _point,
    proxy,
  };
  const proxyData = { address };
  const proxyHash = await api.hashTransaction(
    nonce,
    from,
    proxyType(proxyAddressType),
    proxyData
  );

  return setProxy(
    api,
    proxyAddressType,
    signTransactionHash(proxyHash, _wallet.privateKey),
    from,
    _wallet.address,
    proxyData
  );
};

export const reticketL2Point = async () => {};
