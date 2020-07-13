import React from 'react';
import { Grid } from 'indigo-react';

import { useHistory } from 'store/history';

import useCurrentPointName from 'lib/useCurrentPointName';
import useRouter from 'lib/useRouter';
import { LocalRouterProvider } from 'lib/LocalRouter';

import View from 'components/View';
import Crumbs from 'components/Crumbs';

import AdminHome from './Admin/AdminHome';
import AdminEditPermissions from './Admin/AdminEditPermissions';
import AdminReticket from './Admin/AdminReticket';
import AdminSetProxy from './Admin/AdminSetProxy';
import AdminTransfer from './Admin/AdminTransfer';
import AdminCancelTransfer from './Admin/AdminCancelTransfer';
import AdminNetworkingKeys from './Admin/AdminNetworkingKeys';

const NAMES = {
  HOME: 'HOME',
  EDIT_PERMISSIONS: 'EDIT_PERMISSIONS',
  RETICKET: 'RETICKET',
  SET_PROXY: 'SET_PROXY',
  TRANSFER: 'TRANSFER',
  CANCEL_TRANSFER: 'CANCEL_TRANSFER',
  NETWORKING_KEYS: 'NETWORKING_KEYS',
};

const VIEWS = {
  [NAMES.HOME]: AdminHome,
  [NAMES.EDIT_PERMISSIONS]: AdminEditPermissions,
  [NAMES.RETICKET]: AdminReticket,
  [NAMES.SET_PROXY]: AdminSetProxy,
  [NAMES.TRANSFER]: AdminTransfer,
  [NAMES.CANCEL_TRANSFER]: AdminCancelTransfer,
  [NAMES.NETWORKING_KEYS]: AdminNetworkingKeys,
};

export default function Admin() {
  const history = useHistory();
  const name = useCurrentPointName();

  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.HOME }],
  });

  return (
    <View pop={router.pop} inset>
      <LocalRouterProvider value={router}>
        <Grid className="mb4">
          <Grid.Item
            full
            as={Crumbs}
            routes={[
              {
                text: name,
                action: () => history.pop(),
              },
              {
                text: 'Admin',
              },
            ]}
          />
        </Grid>
        <Route />
      </LocalRouterProvider>
    </View>
  );
}
