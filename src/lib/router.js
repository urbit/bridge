import * as ob from 'urbit-ob';
import * as need from './need';

import Landing from '../views/Landing';
import Login from '../views/Login.js';
import InviteTicket from '../views/InviteTicket';
import InvitesManage from '../views/InvitesManage.js';
import Admin from '../views/Admin';
import Redownload from '../views/Redownload';
import Reticket from '../views/Reticket';
import AcceptTransfer from '../views/AcceptTransfer';
import CancelTransfer from '../views/CancelTransfer';
import CreateGalaxy from '../views/CreateGalaxy';
import GenKeyfile from '../views/GenKeyfile';
import IssueChild from '../views/IssueChild';
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
import Transfer from '../views/Transfer';
import Invite from 'views/Invite';

import { ROUTE_NAMES } from './routeNames';

export const ROUTES = {
  [ROUTE_NAMES.DEFAULT]: Landing,
  [ROUTE_NAMES.LANDING]: Landing,
  [ROUTE_NAMES.INVITE_TICKET]: InviteTicket,
  [ROUTE_NAMES.INVITE]: Invite,
  [ROUTE_NAMES.INVITES_MANAGE]: InvitesManage,
  [ROUTE_NAMES.LOGIN]: Login,
  [ROUTE_NAMES.ADMIN]: Admin,
  [ROUTE_NAMES.REDOWNLOAD]: Redownload,
  [ROUTE_NAMES.RETICKET]: Reticket,
  [ROUTE_NAMES.ACCEPT_TRANSFER]: AcceptTransfer,
  [ROUTE_NAMES.CANCEL_TRANSFER]: CancelTransfer,
  [ROUTE_NAMES.VIEW_POINT]: ViewPoint,
  [ROUTE_NAMES.POINTS]: Points,
  [ROUTE_NAMES.POINT]: Point,
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

export const getRouteBreadcrumb = ({ pointCursor }) => route => {
  switch (route.name) {
    case ROUTE_NAMES.INVITE_TICKET:
      return 'Invite code';
    case ROUTE_NAMES.INVITE_TRANSACTIONS:
      return 'Setting up new wallet';
    case ROUTE_NAMES.INVITE:
      return 'Send invites';
    case ROUTE_NAMES.INVITES_MANAGE:
      return 'Manage invites';
    case ROUTE_NAMES.LOGIN:
      return 'Login to Bridge';
    case ROUTE_NAMES.ADMIN:
      return 'Admin';
    case ROUTE_NAMES.RETICKET:
      return 'Reticket';
    case ROUTE_NAMES.POINT:
      return `Overview: ${ob.patp(need.pointCursor(pointCursor))}`;
    case ROUTE_NAMES.POINTS:
      return 'Points';
    case ROUTE_NAMES.VIEW_POINT:
      return 'View';
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
