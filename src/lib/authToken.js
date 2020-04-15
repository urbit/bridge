import * as secp256k1 from 'secp256k1';

import { keccak256, WALLET_TYPES } from './wallet';
import { ledgerSignMessage } from './ledger';
import { trezorSignMessage } from './trezor';

const MESSAGE = 'Bridge Authentication Token';

function signMessage(privateKey) {
  const { signature } = secp256k1.sign(
    keccak256('\x19Ethereum Signed Message:\n' + MESSAGE.length + MESSAGE),
    privateKey
  );
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
