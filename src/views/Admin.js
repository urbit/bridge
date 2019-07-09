import React from 'react';
import { Grid } from 'indigo-react';

import View from 'components/View';

import { useHistory } from 'store/history';
import Crumbs from 'components/Crumbs';
import useCurrentPointName from 'lib/useCurrentPointName';
import useRouter from 'lib/useRouter';
import AdminHome from './Admin/AdminHome';
import { LocalRouterProvider } from 'lib/LocalRouter';

const NAMES = {
  HOME: 'HOME',
};

const VIEWS = {
  [NAMES.HOME]: AdminHome,
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
