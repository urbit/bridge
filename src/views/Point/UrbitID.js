import React from 'react';

import { useHistory } from 'store/history';
import { useRollerStore } from 'store/rollerStore';

import useRouter from 'lib/useRouter';
import { LocalRouterProvider } from 'lib/LocalRouter';

import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';

import UrbitIDHome from '../UrbitID/Home';
import SigilGenerator from '../UrbitID/SigilGenerator';
import DownloadKeys from '../UrbitID/DownloadKeys';
import SetProxy from '../UrbitID/SetProxy';
import ResetKeys from '../UrbitID/ResetKeys';
import Transfer from '../UrbitID/Transfer.tsx';

const NAMES = {
  HOME: 'HOME',
  SIGIL_GENERATOR: 'SIGIL_GENERATOR',
  DOWNLOAD_KEYS: 'DOWNLOAD_KEYS',
  SET_PROXY: 'SET_PROXY',
  RESET_KEYS: 'RESET_KEYS',
  TRANSFER: 'TRANSFER',
};

const VIEWS = {
  [NAMES.HOME]: UrbitIDHome,
  [NAMES.SIGIL_GENERATOR]: SigilGenerator,
  [NAMES.DOWNLOAD_KEYS]: DownloadKeys,
  [NAMES.RESET_KEYS]: ResetKeys,
  [NAMES.SET_PROXY]: SetProxy,
  [NAMES.TRANSFER]: Transfer,
};

export default function UrbitID() {
  const history = useHistory();
  const { point } = useRollerStore();

  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.HOME }],
  });

  const onBack = () =>
    router.peek().key === NAMES.HOME ? history.pop() : router.pop();

  return (
    <View
      pop={onBack}
      inset
      hideBack
      header={<L2BackHeader hideBalance={point.isL2} back={onBack} />}
      className="urbit-id">
      <LocalRouterProvider value={router}>
        <Route />
      </LocalRouterProvider>
    </View>
  );
}
