import BN from 'bn.js'
import Maybe from 'folktale/maybe'

import * as noun from '../nockjs/noun'
import * as serial from '../nockjs/serial'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'

import { BRIDGE_ERROR } from './error'
import {
  addressFromSecp256k1Public,
  WALLET_NAMES,
  eqAddr
  } from './wallet'

// ctsy joemfb
const b64 = buf => {
  let hex = buf.reverse().toString('hex')
  let n = new BN(hex, 'hex')
  let c = []
  while (1 === n.cmpn(0)) {
    c.push(n.andln(0x3f))
    n = n.shrn(6)
  }

  const trans = j =>
      10 > j
    ? j + 48
    : 36 > j
    ? j + 87
    : 62 > j
    ? j + 29
    : 62 === j
    ? 45
    : 126

  return '0w' +
    c.reduce((a, b, i) =>
      String.fromCharCode(trans(b)) +
      (( i && 0 === i % 5 ) ? '.' : '') + a,
      '')
}

const jam = seed => {
  const hex = serial.jam(seed).toString().slice(2)
  const pad = hex.length % 2 === 0 ? hex : '0' + hex
  return Buffer.from(pad, 'hex').reverse()
}

const genKey = (networkSeed, point, revision) => {
  const pair = kg.deriveNetworkKeys(networkSeed)
  const bnsec = new BN(pair.crypt.private + pair.auth.private + '42', 'hex') // '42' is curve parameter

  const sed = noun.dwim(
    noun.Atom.fromString(point),
    noun.Atom.fromInt(revision),
    noun.Atom.fromString(bnsec.toString()),
    noun.Atom.yes
  )

  return b64(jam(sed))
}

// 'next' refers to setting the next set of keys
// if false, we use revision - 1
const attemptSeedDerivation = async (next, args, assumedRevision) => {
  const { walletType, wallet, pointCursor, pointCache } = args
  const { urbitWallet, authMnemonic } = args

  // If you pass in a revision number, we're going to assume you want
  // to bypass network checks and get a seed anyway
  const isOfflineDerivation = typeof assumedRevision === "number"

  // NB (jtobin):
  //
  // following code is intentionally verbose for sake of clarity

  const walProxy = wallet.matchWith({
    Just: wal => addressFromSecp256k1Public(wal.value.publicKey),
    Nothing: _ => {
      throw BRIDGE_ERROR.MISSING_WALLET
    }
  })

  const point = pointCursor.matchWith({
    Just: pt => pt.value,
    Nothing: _ => {
      throw BRIDGE_ERROR.MISSING_POINT
    }
  })

  const pointDetails =
      point in pointCache
    ? pointCache[point]
    : (() => { throw BRIDGE_ERROR.MISSING_POINT })()

  const revision =
      isOfflineDerivation
    ? assumedRevision
    : next === true
      ? parseInt(pointDetails.keyRevisionNumber)
      : parseInt(pointDetails.keyRevisionNumber) - 1

  let managementSeed = ''

  const ticketLike = [ WALLET_NAMES.TICKET, WALLET_NAMES.SHARDS ]

  if (ticketLike.includes(walletType)) {

    const uwal = urbitWallet.matchWith({
      Just: uw => uw.value,
      Nothing: _ => {
        throw BRIDGE_ERROR.MISSING_URBIT_WALLET
      }
    })

    managementSeed = uwal.management.seed

  } else if (walletType === WALLET_NAMES.MNEMONIC) {

    const mnemonic = authMnemonic.matchWith({
      Just: mnem => mnem.value,
      Nothing: _ => {
        throw BRIDGE_ERROR.MISSING_MNEMONIC
      }
    })

    if (isOfflineDerivation) {
      managementSeed = mnemonic
    } else {
      const chainProxy = pointDetails.managementProxy

      // the network seed is only derivable from mnemonic if the derived
      // management seed equals the record we have on chain
      const networkSeedDerivable = eqAddr(walProxy, chainProxy)

      if (networkSeedDerivable === true) {
        managementSeed = mnemonic
      }
    }
  }

  let networkSeed = Maybe.Nothing()

  if (managementSeed !== '') {
    const seed =
      await kg.deriveNetworkSeed(managementSeed, '', revision)

    networkSeed = Maybe.Just(seed)
  }

  return networkSeed
}

export {
  genKey,
  attemptSeedDerivation
}
