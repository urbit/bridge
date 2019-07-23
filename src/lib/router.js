import Landing from 'views/Landing';
import Disclaimer from 'views/Disclaimer';
import Login from 'views/Login.js';
import Admin from 'views/Admin';
import CreateGalaxy from 'views/CreateGalaxy';
import IssueChild from 'views/IssueChild';
import ViewPoint from 'views/ViewPoint';

import Point from 'views/Point';
import Points from 'views/Points';
import Invite from 'views/Invite';
import Activate from 'views/Activate';

import PartySetPoolSize from 'views/Party/PartySetPoolSize';
import AcceptTransfer from 'views/AcceptTransfer';
import CancelTransfer from 'views/CancelTransfer';

import { ROUTE_NAMES } from './routeNames';

export const ROUTES = {
  [ROUTE_NAMES.LANDING]: Landing,
  [ROUTE_NAMES.DISCLAIMER]: Disclaimer,
  [ROUTE_NAMES.ACTIVATE]: Activate,
  [ROUTE_NAMES.VIEW_POINT]: ViewPoint,
  [ROUTE_NAMES.LOGIN]: Login,
  [ROUTE_NAMES.POINTS]: Points,
  [ROUTE_NAMES.POINT]: Point,
  [ROUTE_NAMES.CREATE_GALAXY]: CreateGalaxy,
  [ROUTE_NAMES.ISSUE_CHILD]: IssueChild,
  [ROUTE_NAMES.INVITE]: Invite,
  [ROUTE_NAMES.ADMIN]: Admin,
  // TODO: nest this route under the Party.js router
  [ROUTE_NAMES.PARTY_SET_POOL_SIZE]: PartySetPoolSize,
  [ROUTE_NAMES.ACCEPT_TRANSFER]: AcceptTransfer,
  // TODO: replace this with deep link to AdminCancelTransfer
  [ROUTE_NAMES.CANCEL_TRANSFER]: CancelTransfer,
};
