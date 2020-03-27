import Transport from '@ledgerhq/hw-transport-u2f';
import Eth from '@ledgerhq/hw-app-eth';

export const LEDGER_LEGACY_PATH = "m/44'/60'/0'/x";
export const LEDGER_LIVE_PATH = "m/44'/60'/x'/0/0";

export const chopHdPrefix = str =>
  str.slice(0, 2) === 'm/' ? str.slice(2) : str;
export const addHdPrefix = str => (str.slice(0, 2) === 'm/' ? str : 'm/' + str);

export const ledgerSignTransaction = async (txn, hdpath) => {
  const transport = await Transport.create();
  const eth = new Eth(transport);

  const path = chopHdPrefix(hdpath);
  const serializedTx = txn.serialize().toString('hex');
  const sig = await eth.signTransaction(path, serializedTx);

  txn.v = Buffer.from(sig.v, 'hex');
  txn.r = Buffer.from(sig.r, 'hex');
  txn.s = Buffer.from(sig.s, 'hex');

  return txn;
};

export const ledgerSignMessage = async (message, hdPath) => {
  const transport = await Transport.create();
  const eth = new Eth(transport);

  const path = chopHdPrefix(hdPath);
  return eth.signPersonalMessage(path, Buffer.from(message).toString('hex'));
};
