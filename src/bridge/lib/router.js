import React from 'react';
import * as ob from 'urbit-ob';
import * as need from '../lib/need';

import Landing from '../views/Landing';
import InviteTicket from '../views/InviteTicket';
import InvitesSend from '../views/InvitesSend.js';
import InvitesManage from '../views/InvitesManage.js';
import AcceptTransfer from '../views/AcceptTransfer';
import CancelTransfer from '../views/CancelTransfer';
import CreateGalaxy from '../views/CreateGalaxy';
import GenKeyfile from '../views/GenKeyfile';
import IssueChild from '../views/IssueChild';
import Network from '../views/Network';
import Mnemonic from '../views/Mnemonic';
import Ledger from '../views/Ledger';
import Trezor from '../views/Trezor';
import PrivateKey from '../views/PrivateKey';
import Keystore from '../views/Keystore';
import ViewPoint from '../views/ViewPoint';
import SentTransaction from '../views/SentTransaction';
import SetKeys from '../views/SetKeys';
import {
  SetManagementProxy,
  SetSpawnProxy,
  SetTransferProxy,
} from '../views/SetProxy';
import Point from '../views/Point';
import Points from '../views/Points';
import Shards from '../views/Shards';
import Ticket from '../views/Ticket';
import Transfer from '../views/Transfer';
import Wallet from '../views/Wallet';

import { EthereumWallet } from './wallet';
import { renderNetworkType } from './network';
import { ROUTE_NAMES } from './routeNames';

const ROUTES = {
  [ROUTE_NAMES.DEFAULT]: Landing,
  [ROUTE_NAMES.LANDING]: Landing,
  [ROUTE_NAMES.INVITE_TICKET]: InviteTicket,
  [ROUTE_NAMES.INVITES_SEND]: InvitesSend,
  [ROUTE_NAMES.INVITES_MANAGE]: InvitesManage,
  [ROUTE_NAMES.ACCEPT_TRANSFER]: AcceptTransfer,
  [ROUTE_NAMES.CANCEL_TRANSFER]: CancelTransfer,
  [ROUTE_NAMES.NETWORK]: Network,
  [ROUTE_NAMES.WALLET]: Wallet,
  [ROUTE_NAMES.VIEW_SHIP]: ViewPoint,
  [ROUTE_NAMES.MNEMONIC]: Mnemonic,
  [ROUTE_NAMES.TICKET]: Ticket,
  [ROUTE_NAMES.SHARDS]: Shards,
  [ROUTE_NAMES.LEDGER]: Ledger,
  [ROUTE_NAMES.TREZOR]: Trezor,
  [ROUTE_NAMES.PRIVATE_KEY]: PrivateKey,
  [ROUTE_NAMES.KEYSTORE]: Keystore,
  [ROUTE_NAMES.SHIPS]: Points,
  [ROUTE_NAMES.SHIP]: Point,
  [ROUTE_NAMES.SET_MANAGEMENT_PROXY]: SetManagementProxy,
  [ROUTE_NAMES.SET_SPAWN_PROXY]: SetSpawnProxy,
  [ROUTE_NAMES.SET_TRANSFER_PROXY]: SetTransferProxy,
  [ROUTE_NAMES.CREATE_GALAXY]: CreateGalaxy,
  [ROUTE_NAMES.ISSUE_CHILD]: IssueChild,
  [ROUTE_NAMES.SET_KEYS]: SetKeys,
  [ROUTE_NAMES.TRANSFER]: Transfer,
  [ROUTE_NAMES.SENT_TRANSACTION]: SentTransaction,
  [ROUTE_NAMES.GEN_KEYFILE]: GenKeyfile,
};

export const getRouteBreadcrumb = (props, route) => {
  const { wallet, networkType } = props;

  switch (route.name) {
    case ROUTE_NAMES.INVITE_TICKET:
      return 'Invite code';
    case ROUTE_NAMES.INVITE_TRANSACTIONS:
      return 'Setting up new wallet';
    case ROUTE_NAMES.INVITES_SEND:
      return 'Send invites';
    case ROUTE_NAMES.INVITES_MANAGE:
      return 'Manage invites';
    case ROUTE_NAMES.NETWORK:
      return `${renderNetworkType(networkType)}`;
    case ROUTE_NAMES.WALLET:
      return wallet.matchWith({
        Nothing: () => 'Wallet',
        Just: wal =>
          wal.value instanceof EthereumWallet ? (
            <span className="text-mono">{wal.value.address}</span>
          ) : (
            <span className="text-mono">{wal.value.address}</span>
          ),
      });
    case ROUTE_NAMES.MNEMONIC:
      return 'Mnemonic';
    case ROUTE_NAMES.TICKET:
      return 'Urbit Ticket';
    case ROUTE_NAMES.SHARDS:
      return 'Urbit Ticket';
    case ROUTE_NAMES.LEDGER:
      return 'Ledger';
    case ROUTE_NAMES.TREZOR:
      return 'Trezor';
    case ROUTE_NAMES.PRIVATE_KEY:
      return 'Private Key';
    case ROUTE_NAMES.KEYSTORE:
      return 'Keystore File';
    case ROUTE_NAMES.SHIPS:
      return 'Points';
    case ROUTE_NAMES.VIEW_SHIP:
      return 'View';
    case ROUTE_NAMES.SHIP:
      return ob.patp(need.pointCursor(props));
    case ROUTE_NAMES.SET_TRANSFER_PROXY:
    case ROUTE_NAMES.SET_MANAGEMENT_PROXY:
    case ROUTE_NAMES.SET_SPAWN_PROXY:
      return 'Set Proxy';
    case ROUTE_NAMES.CREATE_GALAXY:
      return 'Create Galaxy';
    case ROUTE_NAMES.ISSUE_CHILD:
      return 'Issue Child';
    case ROUTE_NAMES.TRANSFER:
      return 'Transfer';
    case ROUTE_NAMES.ACCEPT_TRANSFER:
      return 'Accept Transfer';
    case ROUTE_NAMES.CANCEL_TRANSFER:
      return 'Cancel Transfer';
    case ROUTE_NAMES.GEN_KEYFILE:
      return 'Keyfile';
    case ROUTE_NAMES.SET_KEYS:
      return 'Configure Keys';
    case ROUTE_NAMES.SENT_TRANSACTION:
      return 'Txn';
    case ROUTE_NAMES.LANDING:
    default:
      return 'Bridge';
  }
};

export const router = route => ROUTES[route.name];
