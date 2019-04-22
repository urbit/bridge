import * as ob from 'urbit-ob'

import React from 'react';

import Landing from '../views/Landing'

import InviteTicket from '../views/InviteTicket'
import InviteTransactions from '../views/InviteTransactions.js'

import AcceptTransfer from '../views/AcceptTransfer'
import CancelTransfer from '../views/CancelTransfer'
import CreateGalaxy from '../views/CreateGalaxy'
import GenKeyfile from '../views/GenKeyfile'
import IssueChild from '../views/IssueChild'
import Network from '../views/Network'
import Mnemonic from '../views/Mnemonic'
import Ledger from '../views/Ledger'
import Trezor from '../views/Trezor'
import PrivateKey from '../views/PrivateKey'
import Keystore from '../views/Keystore'
import ViewPoint from '../views/ViewPoint'
import SentTransaction from '../views/SentTransaction'
import SetKeys from '../views/SetKeys'
import {
  SetManagementProxy,
  SetSpawnProxy,
  SetTransferProxy
  } from '../views/SetProxy'
import Point from '../views/Point'
import Points from '../views/Points'
import Shards from '../views/Shards'
import Ticket from '../views/Ticket'
import Transfer from '../views/Transfer'
import Wallet from '../views/Wallet'

import { addressFromSecp256k1Public, EthereumWallet } from './wallet'
import { renderNetworkType } from './network'
import { BRIDGE_ERROR } from './error'

const ROUTE_NAMES = {
  DEFAULT: Symbol('DEFAULT'),
  //
  INVITE_TICKET: Symbol('INVITE_TICKET'),
  INVITE_TRANSACTIONS: Symbol('INVITE_TRANSACTIONS'),
  //
  ACCEPT_TRANSFER: Symbol('ACCEPT_TRANSFER'),
  CANCEL_TRANSFER: Symbol('CANCEL_TRANSFER'),
  LANDING: Symbol('LANDING'),
  NETWORK: Symbol('NETWORK'),
  WALLET: Symbol('WALLET'),
  MNEMONIC: Symbol('MNEMONIC'),
  TICKET: Symbol('TICKET'),
  SHARDS: Symbol('SHARDS'),
  LEDGER: Symbol('LEDGER'),
  TREZOR: Symbol('TREZOR'),
  PRIVATE_KEY: Symbol('PRIVATE_KEY'),
  KEYSTORE: Symbol('KEYSTORE'),
  VIEW_SHIP: Symbol('VIEW_SHIP'),
  SHIPS: Symbol('SHIPS'),
  SHIP: Symbol('SHIP'),
  SET_MANAGEMENT_PROXY: Symbol('SET_MANAGEMENT_PROXY'),
  SET_SPAWN_PROXY: Symbol('SET_SPAWN_PROXY'),
  SET_TRANSFER_PROXY: Symbol('SET_TRANSFER_PROXY'),
  CREATE_GALAXY: Symbol('CREATE_GALAXY'),
  ISSUE_CHILD: Symbol('ISSUE_CHILD'),
  SET_KEYS: Symbol('SET_KEYS'),
  TRANSFER: Symbol('TRANSFER'),
  SENT_TRANSACTION: Symbol('SENT_TRANSACTION'),
  GEN_KEYFILE: Symbol('GEN_KEYFILE')
}

const createRoutes = () => {
  const routes = {}
  routes[ROUTE_NAMES.DEFAULT] = Landing
  //
  routes[ROUTE_NAMES.INVITE_TICKET] = InviteTicket
  routes[ROUTE_NAMES.INVITE_TRANSACTIONS] = InviteTransactions
  //
  routes[ROUTE_NAMES.ACCEPT_TRANSFER] = AcceptTransfer
  routes[ROUTE_NAMES.CANCEL_TRANSFER] = CancelTransfer
  routes[ROUTE_NAMES.LANDING] = Landing
  routes[ROUTE_NAMES.NETWORK] = Network
  routes[ROUTE_NAMES.WALLET] = Wallet
  routes[ROUTE_NAMES.VIEW_SHIP] = ViewPoint
  routes[ROUTE_NAMES.MNEMONIC] = Mnemonic
  routes[ROUTE_NAMES.TICKET] = Ticket
  routes[ROUTE_NAMES.SHARDS] = Shards
  routes[ROUTE_NAMES.LEDGER] = Ledger
  routes[ROUTE_NAMES.TREZOR] = Trezor
  routes[ROUTE_NAMES.PRIVATE_KEY] = PrivateKey
  routes[ROUTE_NAMES.KEYSTORE] = Keystore
  routes[ROUTE_NAMES.SHIPS] = Points
  routes[ROUTE_NAMES.SHIP] = Point
  routes[ROUTE_NAMES.SET_MANAGEMENT_PROXY] = SetManagementProxy
  routes[ROUTE_NAMES.SET_SPAWN_PROXY] = SetSpawnProxy
  routes[ROUTE_NAMES.SET_TRANSFER_PROXY] = SetTransferProxy
  routes[ROUTE_NAMES.CREATE_GALAXY] = CreateGalaxy
  routes[ROUTE_NAMES.ISSUE_CHILD] = IssueChild
  routes[ROUTE_NAMES.SET_KEYS] = SetKeys
  routes[ROUTE_NAMES.TRANSFER] = Transfer
  routes[ROUTE_NAMES.SENT_TRANSACTION] = SentTransaction
  routes[ROUTE_NAMES.GEN_KEYFILE] = GenKeyfile
  return routes
}

const ROUTES = createRoutes()

const renderRoute = (props, route) => {
  const { wallet, networkType, pointCursor } = props
  return (
      route === ROUTE_NAMES.LANDING
    ? 'Bridge'

    : route === ROUTE_NAMES.INVITE_TICKET
    ? 'Invite code'

    : route === ROUTE_NAMES.INVITE_TRANSACTIONS
    ? 'Setting up new wallet'

    : route === ROUTE_NAMES.NETWORK
    ? `${renderNetworkType(networkType)}`

    : route === ROUTE_NAMES.WALLET
    ? wallet.matchWith({
        Nothing: () => 'Wallet',
        Just: (wal) =>
            wal.value instanceof EthereumWallet
          ? (<span className="text-mono">{wal.value.address}</span>)
          : (<span className="text-mono">{addressFromSecp256k1Public(wal.value.publicKey)}</span>)
      })

    : route === ROUTE_NAMES.MNEMONIC
    ? 'Mnemonic'

    : route === ROUTE_NAMES.TICKET
    ? 'Urbit Ticket'

    : route === ROUTE_NAMES.SHARDS
    ? 'Urbit Ticket'

    : route === ROUTE_NAMES.LEDGER
    ? 'Ledger'

    : route === ROUTE_NAMES.TREZOR
    ? 'Trezor'

    : route === ROUTE_NAMES.PRIVATE_KEY
    ? 'Private Key'

    : route === ROUTE_NAMES.KEYSTORE
    ? 'Keystore File'

    : route === ROUTE_NAMES.SHIPS
    ? 'Points'

    : route === ROUTE_NAMES.VIEW_SHIP
    ? 'View'

    : route === ROUTE_NAMES.SHIP
    ? pointCursor.matchWith({
        Just: (cursor) => ob.patp(cursor.value),
        Nothing: () => {
          throw BRIDGE_ERROR.MISSING_POINT
        }
      })

    : route === ROUTE_NAMES.SET_TRANSFER_PROXY
      || route === ROUTE_NAMES.SET_MANAGEMENT_PROXY
      || route === ROUTE_NAMES.SET_SPAWN_PROXY
    ? 'Set Proxy'

    : route === ROUTE_NAMES.CREATE_GALAXY
    ? 'Create Galaxy'

    : route === ROUTE_NAMES.ISSUE_CHILD
    ? 'Issue Child'

    : route === ROUTE_NAMES.TRANSFER
    ? 'Transfer'

    : route === ROUTE_NAMES.ACCEPT_TRANSFER
    ? 'Accept Transfer'

    : route === ROUTE_NAMES.CANCEL_TRANSFER
    ? 'Cancel Transfer'

    : route === ROUTE_NAMES.GEN_KEYFILE
    ? 'Keyfile'

    : route === ROUTE_NAMES.SET_KEYS
    ? 'Configure Keys'

    : route === ROUTE_NAMES.SENT_TRANSACTION
    ? 'Txn'

    : 'Bridge'
  )
}

const router = (route) =>
  ROUTES[route]

export {
  ROUTE_NAMES,
  router,
  renderRoute
}
