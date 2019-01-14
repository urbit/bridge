import TrezorConnect from 'trezor-connect'

const TREZOR_BASE_PATH = "m/44'/60'/0'/0/0"

const formatChainId = val =>
    typeof val === 'number'
  ? val
  : parseInt(val.slice(2), 16) // assume 0x-prefixed hex string

const trezorSignTransaction = async txn => {
  const trezorFormattedTxn = {
    to: txn.to.toString('hex'),
    value: txn.value.toString('hex'),
    data: txn.data.toString('hex'),
    gasLimit: txn.gasLimit.toString('hex'),
    gasPrice: txn.gasPrice.toString('hex'),
    nonce: txn.nonce.length === 0 ? '00' : txn.nonce.toString('hex'),
    chainId: formatChainId(txn.getChainId())
  }

  const sig = await TrezorConnect.ethereumSignTransaction({
    path: TREZOR_BASE_PATH,
    transaction: trezorFormattedTxn
  })

  const payload = sig.payload

  txn.v = Buffer.from(payload.v.slice(2), 'hex')
  txn.r = Buffer.from(payload.r.slice(2), 'hex')
  txn.s = Buffer.from(payload.s.slice(2), 'hex')

  return txn
}

export {
  TREZOR_BASE_PATH,
  trezorSignTransaction
}

