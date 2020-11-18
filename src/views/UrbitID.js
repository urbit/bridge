import React from 'react';
import { Grid } from 'indigo-react';

import { useHistory } from 'store/history';

import useCurrentPointName from 'lib/useCurrentPointName';
import useRouter from 'lib/useRouter';
import { LocalRouterProvider } from 'lib/LocalRouter';

import View from 'components/View';
import Crumbs from 'components/Crumbs';
import NavHeader from 'components/NavHeader';

import UrbitIDHome from './UrbitID/Home';
import SigilGenerator from './UrbitID/SigilGenerator';
import DownloadKeys from './UrbitID/DownloadKeys';
import SetProxy from './UrbitID/SetProxy';
import ResetKeys from './UrbitID/ResetKeys';
import Transfer from './UrbitID/Transfer';
import Claims from './UrbitID/Claims';
import MakeClaim from './UrbitID/Claims/MakeClaim';
import MakeAltId from './UrbitID/Claims/MakeAltId';

const NAMES = {
  HOME: 'HOME',
  SIGIL_GENERATOR: 'SIGIL_GENERATOR',
  DOWNLOAD_KEYS: 'DOWNLOAD_KEYS',
  SET_PROXY: 'SET_PROXY',
  RESET_KEYS: 'RESET_KEYS',
  TRANSFER: 'TRANSFER',
  CLAIMS: 'CLAIMS',
  MAKE_CLAIM: 'MAKE_CLAIM',
  MAKE_ALTID: 'MAKE_ALTID',
};

const VIEWS = {
  [NAMES.HOME]: UrbitIDHome,
  [NAMES.SIGIL_GENERATOR]: SigilGenerator,
  [NAMES.DOWNLOAD_KEYS]: DownloadKeys,
  [NAMES.RESET_KEYS]: ResetKeys,
  [NAMES.SET_PROXY]: SetProxy,
  [NAMES.TRANSFER]: Transfer,
  [NAMES.CLAIMS]: Claims,
  [NAMES.MAKE_CLAIM]: MakeClaim,
  [NAMES.MAKE_ALTID]: MakeAltId,
};

const humanizeName = name => {
  switch (name) {
    case NAMES.SIGIL_GENERATOR:
      return 'Sigil';
    case NAMES.DOWNLOAD_KEYS:
      return 'Download Keys';
    case NAMES.SET_PROXY:
      return 'Set Key';
    case NAMES.RESET_KEYS:
      return 'Reset Keys';
    case NAMES.TRANSFER:
      return 'Transfer';
    case NAMES.CLAIMS:
      return 'Claims';
    case NAMES.MAKE_CLAIM:
      return 'Create Claim';
    case NAMES.MAKE_ALTID:
      return 'Create alt id';

    default:
      return undefined;
  }
};

export default function UrbitID() {
  const history = useHistory();
  const name = useCurrentPointName();

  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.HOME }],
  });

  const last = router.peek().key;
  const homeAction = last === NAMES.HOME ? undefined : () => history.pop();
  const tail = router.routes
    .slice(1)
    .map(route => ({ text: humanizeName(route.key) }));
  const lastCrumb = homeAction ? tail : [];

  return (
    <View pop={router.pop} inset>
      <NavHeader>
        <Crumbs
          routes={[
            { text: name, action: () => history.pop() },
            { text: 'Urbit ID', action: homeAction },
            ...lastCrumb,
          ]}
        />
      </NavHeader>

      <LocalRouterProvider value={router}>
        <Grid className="mb4"></Grid>
        <Route />
      </LocalRouterProvider>
    </View>
  );
}
