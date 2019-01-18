import * as ob from 'urbit-ob'
import Maybe from 'folktale/maybe'
import Result from 'folktale/result'
import Tx from 'ethereumjs-tx'
import Web3 from 'web3'

import { BRIDGE_ERROR } from '../lib/error'
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





// const createUnsignedTxn = config => {
//   const {
//     contracts,
//     galaxyName,
//     add,
//     setTxn
//   } = config
//
//   const ctrcs = contracts.matchWith({
//     Just: (cs) => cs.value,
//     Nothing: () => {
//       throw BRIDGE_ERROR.MISSING_CONTRACTS
//     }
//   })
//
//   const galaxy = parseInt(ob.patp2dec(galaxyName), 10)
//
//   const txn = isValidGalaxy(galaxyName) && isValidAddress(galaxyOwner)
//     ? Maybe.Just(azimuth.ecliptic.createGalaxy(ctrcs, galaxy, galaxyOwner))
//     : Maybe.Nothing()
//
//   setTxn(txn)
// }


const signTransaction = async config => {

  let {
    wallet,
    walletType,
    walletHdPath,
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

  const wal = wallet.matchWith({
    Just: (w) => w.value,
    Nothing: () => {
      throw BRIDGE_ERROR.MISSING_WALLET
    }
  })

  const sec = wal.privateKey

  const utx = txn.matchWith({
    Just: (tx) =>
      Object.assign(tx.value, { nonce, chainId, gasPrice, gasLimit }),
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

  setStx(Maybe.Just(stx))
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
      .on('receipt', txn =>
        resolve(Maybe.Just(Result.Ok(txn)))
      )
      .on('error', err => {
        reject(Maybe.Just(Result.Error(err.message)))
      })
  })
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


// const confirmShipAvailability = (point, contracts) => {
//
//   if (canDecodePatp(point) === true) {
//
//     const pointDec = ob.patp2dec(point)
//
//     contracts.matchWith({
//       Nothing: () => {
//         throw BRIDGE_ERROR.MISSING_CONTRACTS
//       },
//       Just: async (contracts) => {
//         const owner = await azimuth.azimuth.getOwner(contracts.value, point)
//         if (eqAddr(owner, ETH_ZERO_ADDR)) return true
//         return false
//       }
//     })
//   }
//   return false
// }


const canDecodePatp = p => {
  try {
    ob.patp2dec(p)
    return true
  } catch (_) {
    return false
  }
}





// const bridgeAPI = {
//   shipAvailability: {
//     planet: planet => {},
//     star: star => {},
//     galaxy: galaxy => {},
//   },
//   // dummyWeb3: {
//   //
//   // }
// }

export {
  signTransaction,
  sendSignedTransaction,
  TXN_PURPOSE,
  getTxnInfo,
  renderTxnPurpose,
  hexify,
  renderSignedTx,
  toHex,
  toWei,
  fromWei,
  canDecodePatp,
  // confirmShipAvailability,
}
