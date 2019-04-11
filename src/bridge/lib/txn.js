import * as ob from 'urbit-ob'
import { Just } from 'folktale/maybe'
import { Ok, Error } from 'folktale/result'
import Tx from 'ethereumjs-tx'
import Web3 from 'web3'

import { BRIDGE_ERROR } from '../lib/error'
import { NETWORK_NAMES } from '../lib/network'
import { ledgerSignTransaction } from '../lib/ledger'
import { trezorSignTransaction } from '../lib/trezor'
import {
  WALLET_NAMES,
  addHexPrefix
  } from '../lib/wallet'

const TXN_PURPOSE = {
  SET_MANAGEMENT_PROXY: Symbol('SET_MANAGEMENT_PROXY'),
  SET_TRANSFER_PROXY: Symbol('SET_TRANSFER_PROXY'),
  SET_SPAWN_PROXY: Symbol('SET_SPAWN_PROXY'),
  CREATE_GALAXY: Symbol('CREATE_GALAXY'),
  ISSUE_CHILD: Symbol('ISSUE_CHILD'),
  SET_KEYS: Symbol('SET_KEYS'),
  TRANSFER: Symbol('TRANSFER'),
  CANCEL_TRANSFER: Symbol('CANCEL_TRANSFER')
}

const renderTxnPurpose = (purpose) =>
    purpose === TXN_PURPOSE.SET_MANAGEMENT_PROXY
  ? 'set this management proxy'
  : purpose === TXN_PURPOSE.SET_SPAWN_PROXY
  ? 'set this spawn proxy'
  : purpose === TXN_PURPOSE.SET_TRANSFER_PROXY
  ? 'set this transfer proxy'
  : purpose === TXN_PURPOSE.CREATE_GALAXY
  ? 'create this galaxy'
  : purpose === TXN_PURPOSE.ISSUE_CHILD
  ? 'issue this point'
  : purpose === TXN_PURPOSE.SET_KEYS
  ? 'set these network keys'
  : purpose === TXN_PURPOSE.TRANSFER
  ? 'transfer this point'
  : purpose === TXN_PURPOSE.CANCEL_TRANSFER
  ? 'cancel this transfer'
  : 'perform this transaction'

const signTransaction = async config => {

  let {
    wallet,
    walletType,
    walletHdPath,
    networkType,
    txn,
    setStx,
    nonce,
    chainId,
    gasPrice,
    gasLimit
  } = config

  nonce = toHex(nonce)
  chainId = toHex(chainId)
  gasPrice = toHex(toWei(gasPrice, 'gwei'))
  gasLimit = toHex(gasLimit)

  const txParams = { nonce, chainId, gasPrice, gasLimit }

  // NB (jtobin)
  //
  // Ledger does not seem to handle EIP-155 automatically.  When using a Ledger,
  // if the block number is at least FORK_BLKNUM = 2675000, one needs to
  // pre-set the ECDSA signature parameters with r = 0, s = 0, and v = chainId
  // prior to signing.
  //
  // The easiest way to handle this is to just branch on the network, since
  // mainnet and Ropsten have obviously passed FORK_BLKNUM.  This is somewhat
  // awkward when dealing with offline transactions, since we might want to
  // test them on a local network as well.
  //
  // The best thing to do is probably to add an 'advanced' tab to offline
  // transaction generation where one can disable the defaulted-on EIP-155
  // settings in this case.  This is pretty low-priority, but is a
  // comprehensive solution.
  //
  // See:
  //
  // See https://github.com/LedgerHQ/ledgerjs/issues/43#issuecomment-366984725
  //
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md

  const eip155Params = {
    r: '0x00',
    s: '0x00',
    v: chainId
  }

  const defaultEip155Networks = [
    NETWORK_NAMES.MAINNET,
    NETWORK_NAMES.ROPSTEN,
    NETWORK_NAMES.OFFLINE
  ]

  const needEip155Params =
    walletType === WALLET_NAMES.LEDGER &&
    defaultEip155Networks.includes(networkType)

  const signingParams =
      needEip155Params
    ? Object.assign(txParams, eip155Params)
    : txParams

  const wal = wallet.matchWith({
    Just: (w) => w.value,
    Nothing: () => { throw BRIDGE_ERROR.MISSING_WALLET }
  })

  const sec = wal.privateKey

  const utx = txn.matchWith({
    Just: (tx) =>
      Object.assign(tx.value, signingParams),
    Nothing: () => {
      throw BRIDGE_ERROR.MISSING_TXN
    }
  })

  const stx = new Tx(utx)

  if (walletType === WALLET_NAMES.LEDGER) {
    await ledgerSignTransaction(stx, walletHdPath)
  } else if (walletType === WALLET_NAMES.TREZOR) {
    await trezorSignTransaction(stx, walletHdPath)
  } else {
    stx.sign(sec)
  }

  setStx(Just(stx))
}

const sendSignedTransaction = (web3, stx) => {
  const txn = stx.matchWith({
    Just: (tx) => tx.value,
    Nothing: () => {
      throw BRIDGE_ERROR.MISSING_TXN
    }
  })

  const serializedTx = addHexPrefix(txn.serialize().toString('hex'))

  return new Promise((resolve, reject) => {
    web3.eth.sendSignedTransaction(serializedTx)
      .on('transactionHash', hash =>
        resolve(Just(Ok(hash)))
      )
      .on('receipt', txn => {
        resolve(Just(Ok(txn.transactionHash)))
      })
      .on('error', err => {
        reject(Just(Error(err.message)))
      })
  })
}

// returns a Promise
const waitForTransactionConfirm = (web3, txHash) => {
  return new Promise((resolve, reject) => {
    const checkForConfirm = async () => {
      console.log('checking for confirm', txHash);
      let confirmed = isTransactionConfirmed(web3, txHash);
      if (confirmed) resolve();
      else setTimeout(checkForConfirm, 13000);
    }
    checkForConfirm();
  });
}

const isTransactionConfirmed = async (web3, txHash) => {
  const receipt = await web3.eth.getTransactionReceipt(txHash);
  console.log('got confirm state', receipt !== null, receipt.confirmations);
  return (receipt !== null);
}

const hexify = val => addHexPrefix(val.toString('hex'))

const renderSignedTx = stx => ({
  messageHash: hexify(stx.hash()),
  v: hexify(stx.v),
  s: hexify(stx.s),
  r: hexify(stx.r),
  rawTransaction: hexify(stx.serialize())
})

const getTxnInfo = async (web3, addr) => {
  let nonce = await web3.eth.getTransactionCount(addr)
  let chainId = await web3.eth.net.getId()
  let gasPrice = await web3.eth.getGasPrice()
  return {
    nonce: nonce,
    chainId: chainId,
    gasPrice: fromWei(gasPrice, 'gwei')
  }
}

const dummy = new Web3()
const toHex = dummy.utils.toHex
const toWei = dummy.utils.toWei
const fromWei = dummy.utils.fromWei

const canDecodePatp = p => {
  try {
    ob.patp2dec(p)
    return true
  } catch (_) {
    return false
  }
}

export {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  isTransactionConfirmed,
  TXN_PURPOSE,
  getTxnInfo,
  renderTxnPurpose,
  hexify,
  renderSignedTx,
  toHex,
  toWei,
  fromWei,
  canDecodePatp,
}
