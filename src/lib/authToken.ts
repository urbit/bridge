import { crypto } from 'bitcoinjs-lib';
import { ecdsaSign } from 'secp256k1';
import Web3 from 'web3';
import { hexToBytes } from 'web3-utils';
import WalletConnect from '@walletconnect/client';

import { WALLET_TYPES } from './constants';
import { ledgerSignMessage } from './ledger';
import { trezorSignMessage } from './trezor';
import BridgeWallet from './types/BridgeWallet';
import { Hash } from '@urbit/roller-api';
import { keccak256 } from 'ethereumjs-util';

const MESSAGE = 'Bridge Authentication Token';

function signMessage(privateKey: Buffer, hashFunction = keccak256) {
  const msg = '\x19Ethereum Signed Message:\n' + MESSAGE.length + MESSAGE;
  const hashed = hashFunction(Buffer.from(msg));
  const { signature } = ecdsaSign(Buffer.from(hashed), privateKey);

  // add key recovery parameter
  const ethSignature = new Uint8Array(65);
  ethSignature.set(signature);
  const v = (ethSignature[32] & 1) + 27;
  ethSignature[64] = v;

  return ethSignature;
}

export function signTransactionHash(msg: Hash, prvKey: Buffer) {
  //  msg is a keccak-256 hash
  //
  const hashed = Buffer.from(hexToBytes(msg));
  const { signature, recid } = ecdsaSign(hashed, prvKey);
  // add key recovery parameter
  const ethSignature = new Uint8Array(65);
  ethSignature.set(signature);
  ethSignature[64] = recid;
  return `0x${Buffer.from(ethSignature).toString('hex')}`;
}

type MetamaskAuthTokenArgs = {
  address: string;
  web3: Web3;
  walletType: symbol;
};

type LedgerAuthTokenArgs = {
  walletHdPath: string;
  walletType: symbol;
};

type TrezorAuthTokenArgs = LedgerAuthTokenArgs;

type WalletConnectAuthTokenArgs = {
  address: string;
  connector: WalletConnect;
  walletType: symbol;
};

type DefaultAuthTokenArgs = {
  wallet: BridgeWallet;
  walletType?: symbol;
};

type GetAuthTokenArgs =
  | MetamaskAuthTokenArgs
  | LedgerAuthTokenArgs
  | TrezorAuthTokenArgs
  | WalletConnectAuthTokenArgs
  | DefaultAuthTokenArgs;

const getMetamaskAuthToken = ({ address, web3 }: MetamaskAuthTokenArgs) => {
  if (window.ethereum) {
    //NOTE  this doesn't _seem_ to be affected by #596,
    //      but web3.eth.personal.sign hits it semi-reliably?
    //      no idea what's going on, we should figure it out,
    //      but we apply this bandaid to hopefully stop the bleeding.
    return window.ethereum.request({
      method: 'personal_sign',
      params: [MESSAGE, address],
      from: address,
    });
  } else {
    return web3.eth.personal.sign(MESSAGE, address, '');
  }
};

const getLedgerAuthToken = ({ walletHdPath }: LedgerAuthTokenArgs) => {
  return ledgerSignMessage(MESSAGE, walletHdPath);
};

const getTrezorAuthToken = ({ walletHdPath }: TrezorAuthTokenArgs) => {
  return trezorSignMessage(MESSAGE, walletHdPath);
};

const getWalletConnectAuthToken = ({
  address,
  connector,
}: WalletConnectAuthTokenArgs) => {
  return connector.signPersonalMessage([MESSAGE, address]);
};

const getDefaultAuthToken = ({ wallet }: DefaultAuthTokenArgs) => {
  const signature = signMessage(wallet.privateKey!);

  const token = `0x${Buffer.from(signature).toString('hex')}`;

  return token;
};

export const getSha256AuthToken = ({ wallet }: DefaultAuthTokenArgs) => {
  const signature = signMessage(wallet.privateKey!, crypto.sha256);

  const token = `0x${Buffer.from(signature).toString('hex')}`;

  return token;
};

export const getAuthToken = async ({
  walletType,
  ...args
}: GetAuthTokenArgs) => {
  switch (walletType) {
    case WALLET_TYPES.METAMASK:
      return getMetamaskAuthToken(args as MetamaskAuthTokenArgs);
    case WALLET_TYPES.LEDGER:
      return getLedgerAuthToken(args as LedgerAuthTokenArgs);
    case WALLET_TYPES.TREZOR:
      return getTrezorAuthToken(args as TrezorAuthTokenArgs);
    case WALLET_TYPES.WALLET_CONNECT:
      return getWalletConnectAuthToken(args as WalletConnectAuthTokenArgs);
    default:
      return getDefaultAuthToken(args as DefaultAuthTokenArgs);
  }
};
