import Transport from '@ledgerhq/hw-transport-u2f'
import Eth from '@ledgerhq/hw-app-eth'

const LEDGER_BASE_PATH = "44'/60'/0'/0/0"

const ledgerSignTransaction = async txn => {
  const transport = await Transport.create()
  const eth = new Eth(transport)

  const serializedTx = txn.serialize().toString('hex')
  const sig = await eth.signTransaction(LEDGER_BASE_PATH, serializedTx)

  txn.v = Buffer.from(sig.v, 'hex')
  txn.r = Buffer.from(sig.r, 'hex')
  txn.s = Buffer.from(sig.s, 'hex')

  return txn
}

export {
  LEDGER_BASE_PATH,
  ledgerSignTransaction
}
