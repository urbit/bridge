import { crypto } from 'bitcoinjs-lib';
import { ecdsaSign } from 'secp256k1';
import Web3 from 'web3';
import { hexToBytes } from 'web3-utils';
import WalletConnect from '@walletconnect/client';
import { hashPersonalMessage } from '@ethereumjs/util';
import { WALLET_TYPES } from './constants';
import BridgeWallet from './types/BridgeWallet';
import { Hash } from '@urbit/roller-api';

const MESSAGE = 'Bridge Authentication Token';

function signMessage(privateKey: Buffer, useLegacyTokenSigning = false) {
  const msg = '\x19Ethereum Signed Message:\n' + MESSAGE.length + MESSAGE;
  const hashed = useLegacyTokenSigning
    ? crypto.sha256(Buffer.from(msg))
    : hashPersonalMessage(Buffer.from(MESSAGE)) // msg prefix is handled by lib

  const hashAry = new Uint8Array(hashed.buffer);
  const { signature, recid: _recid } = ecdsaSign(hashAry, privateKey);

  // add key recovery parameter
  const ethSignature = new Uint8Array(65);
  ethSignature.set(signature);

  // https://eips.ethereum.org/EIPS/eip-155
  // This method for setting the recovery parameter is the "legacy" way of doing
  // so; and in fact, does not match up with output of Metamask / Brave Wallet.
  // MM uses 28 instead of 27.
  // TODO: Should we bring this up to latest standard? The problem is, users
  // who have set network keys or generated invites with an older token will
  // not be able to rederive them
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

type WalletConnectAuthTokenArgs = {
  address: string;
  connector: WalletConnect;
  walletType: symbol;
};

type DefaultAuthTokenArgs = {
  wallet: BridgeWallet;
  walletType?: symbol;
  useLegacyTokenSigning?: boolean;
};

type GetAuthTokenArgs =
  | MetamaskAuthTokenArgs
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

const getWalletConnectAuthToken = ({
  address,
  connector,
}: WalletConnectAuthTokenArgs) => {
  return connector.signPersonalMessage([MESSAGE, address]);
};

const getDefaultAuthToken = ({
  wallet,
  useLegacyTokenSigning = false,
}: DefaultAuthTokenArgs) => {
  const signature = signMessage(wallet.privateKey!, useLegacyTokenSigning);

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
    case WALLET_TYPES.WALLET_CONNECT:
      return getWalletConnectAuthToken(args as WalletConnectAuthTokenArgs);
    default:
      return getDefaultAuthToken(args as DefaultAuthTokenArgs);
  }
};
