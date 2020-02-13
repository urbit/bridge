import React from 'react';
import { Grid } from 'indigo-react';

import { useHistory } from 'store/history';

import useCurrentPointName from 'lib/useCurrentPointName';
import useRouter from 'lib/useRouter';
import { LocalRouterProvider } from 'lib/LocalRouter';

import View from 'components/View';
import Crumbs from 'components/Crumbs';

import UrbitOSHome from './UrbitOS/Home';
import UrbitOSNetworkingKeys from './UrbitOS/NetworkingKeys';
import UrbitOSChangeSponsor from './UrbitOS/ChangeSponsor';

const NAMES = {
  HOME: 'HOME',
  CHANGE_SPONSOR: 'CHANGE_SPONSOR',
  NETWORKING_KEYS: 'NETWORKING_KEYS',
};

const VIEWS = {
  [NAMES.HOME]: UrbitOSHome,
  [NAMES.CHANGE_SPONSOR]: UrbitOSChangeSponsor,
  [NAMES.NETWORKING_KEYS]: UrbitOSNetworkingKeys,
};

export default function UrbitOS() {
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
              { text: name, action: () => history.pop() },
              { text: 'Urbit OS' },
            ]}
          />
        </Grid>
        <Route />
      </LocalRouterProvider>
    </View>
  );
}
