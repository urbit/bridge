import * as secp256k1 from 'secp256k1';

import { keccak256, WALLET_TYPES } from './wallet';

const MESSAGE = 'Bridge Authentication Token';

export const getAuthToken = ({ wallet, walletType, walletHdPath, web3 }) => {
  if (walletType === WALLET_TYPES.METAMASK) {
    return web3.eth.personal.sign(MESSAGE, wallet.address, '');
  }
  const { signature } = secp256k1.sign(
    keccak256('\x19Ethereum Signed Message:\n' + MESSAGE.length + MESSAGE),
    wallet.privateKey
  );

  return signature;
};
