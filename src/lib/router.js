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

import { ROUTE_NAMES } from './routeNames';

export const ROUTES = {
  [ROUTE_NAMES.DISCLAIMER]: Disclaimer,
  [ROUTE_NAMES.ACTIVATE]: Activate,
  [ROUTE_NAMES.VIEW_POINT]: ViewPoint,
  [ROUTE_NAMES.LOGIN]: Login,
  [ROUTE_NAMES.POINTS]: Points,
  [ROUTE_NAMES.POINT]: Point,
  [ROUTE_NAMES.CREATE_GALAXY]: CreateGalaxy,
  [ROUTE_NAMES.ISSUE_CHILD]: IssueChild,
  [ROUTE_NAMES.PARTY_SET_POOL_SIZE]: PartySetPoolSize,
  [ROUTE_NAMES.INVITE]: Invite,
  [ROUTE_NAMES.ADMIN]: Admin,
  // TODO: nest this route under the Party.js router
};
