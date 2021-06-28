import { ecdsaSign } from 'secp256k1';
import { keccak256 } from 'web3-utils';

import { WALLET_TYPES } from './constants';
import { ledgerSignMessage } from './ledger';
import { trezorSignMessage } from './trezor';

const MESSAGE = 'Bridge Authentication Token';

function signMessage(privateKey: Buffer) {
  const msg = '\x19Ethereum Signed Message:\n' + MESSAGE.length + MESSAGE;
  // TODO: Signing function expects 32 length Buffer,
  // confirm if it is okay / expected to slice it like this?
  // Based on reading docs and comment threads, it seems that
  // this limit is sometimes enforced, and varies depending on
  // the implementation
  const msgHash = Buffer.from(keccak256(msg)).slice(0, 32);
  const { signature } = ecdsaSign(msgHash, privateKey);

  // add key recovery parameter
  const ethSignature = new Uint8Array(65);
  ethSignature.set(signature);
  const v = (ethSignature[32] & 1) + 27;
  ethSignature[64] = v;

  return ethSignature;
}

export const getAuthToken = async ({
  wallet,
  walletType,
  walletHdPath,
  web3,
}) => {
  if (walletType === WALLET_TYPES.METAMASK) {
    return web3.eth.personal.sign(MESSAGE, wallet.address, '');
  }
  if (walletType === WALLET_TYPES.LEDGER) {
    return ledgerSignMessage(MESSAGE, walletHdPath);
  }
  if (walletType === WALLET_TYPES.TREZOR) {
    return trezorSignMessage(MESSAGE, walletHdPath);
  }

  const signature = signMessage(wallet.privateKey);

  const token = `0x${Buffer.from(signature).toString('hex')}`;

  return token;
};
