import React, { useState } from 'react';

import { useHistory } from 'store/history';

import useRouter from 'lib/useRouter';
import { LocalRouterProvider } from 'lib/LocalRouter';

import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';

import UrbitOSHome from '../UrbitOS/Home';
import UrbitOSNetworkKeys from '../UrbitOS/NetworkKeys.tsx';
import UrbitOSChangeSponsor from '../UrbitOS/ChangeSponsor.tsx';

const NAMES = {
  HOME: 'HOME',
  CHANGE_SPONSOR: 'CHANGE_SPONSOR',
  NETWORKING_KEYS: 'NETWORKING_KEYS',
};

const VIEWS = {
  [NAMES.HOME]: UrbitOSHome,
  [NAMES.CHANGE_SPONSOR]: UrbitOSChangeSponsor,
  [NAMES.NETWORKING_KEYS]: UrbitOSNetworkKeys,
};

export default function UrbitOS() {
  const history = useHistory();

  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.HOME }],
  });

  const [manualNetworkSeed, setManualNetworkSeed] = useState();

  const onBack = () =>
    router.peek().key === NAMES.HOME ? history.pop() : router.pop();

  return (
    <View
      pop={onBack}
      inset
      hideBack
      header={
        <L2BackHeader
          hideBalance={router.peek().key === NAMES.HOME}
          back={onBack}
        />
      }
      className="urbit-id">
      <LocalRouterProvider value={router}>
        <Route
          manualNetworkSeed={manualNetworkSeed}
          setManualNetworkSeed={setManualNetworkSeed}
        />
      </LocalRouterProvider>
    </View>
  );
}
