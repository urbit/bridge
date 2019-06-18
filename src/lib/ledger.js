import Transport from '@ledgerhq/hw-transport-u2f';
import Eth from '@ledgerhq/hw-app-eth';

const LEDGER_LEGACY_PATH = "m/44'/60'/0'/x";
const LEDGER_LIVE_PATH = "m/44'/60'/x'/0/0";

const chopHdPrefix = str => (str.slice(0, 2) === 'm/' ? str.slice(2) : str);

const ledgerSignTransaction = async (txn, hdpath) => {
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

export { LEDGER_LIVE_PATH, LEDGER_LEGACY_PATH, ledgerSignTransaction };
