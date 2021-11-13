import Disclaimer from 'views/Disclaimer';
import Login from 'views/Login';
import Other from 'views/Login/Other';
import Senate from 'views/Point/Senate';
import Documents from 'views/Senate/Documents';
import Upgrades from 'views/Senate/Upgrades';
import CreateGalaxy from 'views/CreateGalaxy';
import StarRelease from 'views/Release';
import AcceptLockup from 'views/AcceptLockup';

import Points from 'views/Points';
import Activate from 'views/Activate';

import Point from 'views/Point/Point';
import UrbitOS from 'views/Point/UrbitOS';
import UrbitID from 'views/Point/UrbitID';
// import Residents from 'views/Point/Residents';
import { Residents } from 'views/Ops/Residents';
import MigrateL2 from 'views/Point/MigrateL2.tsx';
import IssueChild from 'views/Point/IssueChild';

import PartySetPoolSize from 'views/Party/PartySetPoolSize';
import InviteCohort from 'views/Invite/Cohort';
import AcceptTransfer from 'views/AcceptTransfer';
import CancelTransfer from 'views/CancelTransfer';
import Adopt from 'views/Adopt';
import Bitcoin from 'views/Bitcoin/Bitcoin';
import Xpub from 'views/Bitcoin/Xpub';
import SignTransaction from 'views/Bitcoin/SignTransaction';
import TransactionHistory from 'views/Transactions/TransactionHistory';

import { ROUTE_NAMES } from './routeNames';
import { Ops } from 'views/Ops/Ops';
import { Requests } from 'views/Ops/Requests';

export const ROUTES = {
  [ROUTE_NAMES.DISCLAIMER]: Disclaimer,
  [ROUTE_NAMES.ACTIVATE]: Activate,
  [ROUTE_NAMES.LOGIN]: Login,
  [ROUTE_NAMES.LOGIN_OTHER]: Other,
  [ROUTE_NAMES.POINTS]: Points,
  [ROUTE_NAMES.POINT]: Point,
  [ROUTE_NAMES.CREATE_GALAXY]: CreateGalaxy,
  [ROUTE_NAMES.ISSUE_CHILD]: IssueChild,
  [ROUTE_NAMES.SENATE]: Senate,
  [ROUTE_NAMES.DOCUMENTS]: Documents,
  [ROUTE_NAMES.UPGRADES]: Upgrades,
  // TODO: nest this route under the Party.js router
  [ROUTE_NAMES.PARTY_SET_POOL_SIZE]: PartySetPoolSize,
  [ROUTE_NAMES.ACCEPT_TRANSFER]: AcceptTransfer,
  // TODO: replace this with deep link to AdminCancelTransfer
  [ROUTE_NAMES.CANCEL_TRANSFER]: CancelTransfer,
  [ROUTE_NAMES.INVITE_COHORT]: InviteCohort,
  [ROUTE_NAMES.STAR_RELEASE]: StarRelease,
  [ROUTE_NAMES.ACCEPT_LOCKUP]: AcceptLockup,
  [ROUTE_NAMES.URBIT_OS]: UrbitOS,
  [ROUTE_NAMES.URBIT_ID]: UrbitID,
  [ROUTE_NAMES.RESIDENTS]: Residents,
  [ROUTE_NAMES.REQUESTS]: Requests,
  [ROUTE_NAMES.ADOPT]: Adopt,
  [ROUTE_NAMES.BITCOIN]: Bitcoin,
  [ROUTE_NAMES.BITCOIN_XPUB]: Xpub,
  [ROUTE_NAMES.BITCOIN_SIGN_TRANSACTION]: SignTransaction,
  [ROUTE_NAMES.TRANSACTION_HISTORY]: TransactionHistory,
  [ROUTE_NAMES.MIGRATE_L2]: MigrateL2,
  [ROUTE_NAMES.OPS]: Ops,
};
