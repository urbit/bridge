import TrezorConnect from 'trezor-connect';
import { convertToInt } from './convertToInt';
import BN from 'bn.js';
import { Transaction } from '@ethereumjs/tx';

const TREZOR_PATH = "m/44'/60'/0'/0/x";

// handles 0x-prefixed hex string as well as number type
const formatChainId = (val: number | string) =>
  typeof val === 'number' ? val : convertToInt(val.slice(2), 16);

const trezorSignTransaction = async (txn: Transaction, hdpath: string) => {
  const { common, data, gasLimit, gasPrice, nonce, to, value } = txn;
  if (!(common && data && gasLimit && gasPrice && nonce && to && value)) {
    throw new Error('Unable to sign Trezor TX, something is missing');
  }

  const trezorFormattedTxn = {
    to: to.toString(),
    value: value.toString('hex'),
    data: data.toString('hex'),
    gasLimit: gasLimit.toString('hex'),
    gasPrice: gasPrice.toString('hex'),
    nonce: nonce.toString('hex') || '00',
    chainId: formatChainId(common.chainId()),
  };

  const sig = await TrezorConnect.ethereumSignTransaction({
    path: hdpath,
    transaction: trezorFormattedTxn,
  });

  if (!sig.success) {
    throw new Error(sig.payload.error);
  }

  const payload = sig.payload;

  // Typescript is upset that we are updating a readonly
  // property on the TX object. Too bad :)
  //@ts-ignore
  txn.v = new BN(payload.v.slice(2), 'hex');
  //@ts-ignore
  txn.r = new BN(payload.r.slice(2), 'hex');
  //@ts-ignore
  txn.s = new BN(payload.s.slice(2), 'hex');

  return txn;
};

export const trezorSignMessage = async (message: string, hdPath: string) => {
  const sig = await TrezorConnect.ethereumSignMessage({
    path: hdPath,
    message,
  });

  if (!sig.success) {
    throw new Error(sig.payload.error);
  }

  const { signature } = sig.payload;

  return signature;
};

export { TREZOR_PATH, trezorSignTransaction };
