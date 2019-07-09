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
import AdminRedownload from './Admin/AdminRedownload';
import AdminReticket from './Admin/AdminReticket';

const NAMES = {
  HOME: 'HOME',
  EDIT_PERMISSIONS: 'EDIT_PERMISSIONS',
  REDOWNLOAD: 'REDOWNLOAD',
  RETICKET: 'RETICKET',
};

const VIEWS = {
  [NAMES.HOME]: AdminHome,
  [NAMES.EDIT_PERMISSIONS]: AdminEditPermissions,
  [NAMES.REDOWNLOAD]: AdminRedownload,
  [NAMES.RETICKET]: AdminReticket,
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
    <LocalRouterProvider value={router}>
      <View inset>
        <Grid className="mb4">
          <Grid.Item
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
            full
          />
        </Grid>
        <Route />
      </View>
    </LocalRouterProvider>
  );
}
