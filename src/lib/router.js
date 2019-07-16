import Landing from '../views/Landing';
import Disclaimer from '../views/Disclaimer';
import Login from '../views/Login.js';
import InvitesManage from '../views/InvitesManage.js';
import Admin from '../views/Admin';
import AcceptTransfer from '../views/AcceptTransfer';
import CancelTransfer from '../views/CancelTransfer';
import CreateGalaxy from '../views/CreateGalaxy';
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
import Activate from 'views/Activate';

import { ROUTE_NAMES } from './routeNames';

export const ROUTES = {
  [ROUTE_NAMES.LANDING]: Landing,
  [ROUTE_NAMES.DISCLAIMER]: Disclaimer,
  [ROUTE_NAMES.ACTIVATE]: Activate,
  [ROUTE_NAMES.INVITE]: Invite,
  [ROUTE_NAMES.INVITES_MANAGE]: InvitesManage,
  [ROUTE_NAMES.LOGIN]: Login,
  [ROUTE_NAMES.ADMIN]: Admin,
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
};
