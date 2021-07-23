import TrezorConnect from 'trezor-connect';
import { convertToInt } from './convertToInt';

const TREZOR_PATH = "m/44'/60'/0'/0/x";

// handles 0x-prefixed hex string as well as number type
const formatChainId = val =>
  typeof val === 'number' ? val : convertToInt(val.slice(2), 16);

const trezorSignTransaction = async (txn, hdpath) => {
  const trezorFormattedTxn = {
    to: txn.to.toString('hex'),
    value: txn.value.toString('hex'),
    data: txn.data.toString('hex'),
    gasLimit: txn.gasLimit.toString('hex'),
    gasPrice: txn.gasPrice.toString('hex'),
    nonce: txn.nonce.length === 0 ? '00' : txn.nonce.toString('hex'),
    chainId: formatChainId(txn.getChainId()),
  };

  const sig = await TrezorConnect.ethereumSignTransaction({
    path: hdpath,
    transaction: trezorFormattedTxn,
  });

  if (!sig.success) {
    throw new Error(sig.payload.error);
  }

  const payload = sig.payload;

  txn.v = Buffer.from(payload.v.slice(2), 'hex');
  txn.r = Buffer.from(payload.r.slice(2), 'hex');
  txn.s = Buffer.from(payload.s.slice(2), 'hex');

  return txn;
};

export const trezorSignMessage = async (message, hdPath) => {
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
