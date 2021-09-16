import { LocalRouterProvider, useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';

import useRouter from 'lib/useRouter';

import MasterKeyDownload from './MasterKeyDownload';
import MasterKeyTransfer from './MasterKeyTransfer';
import MasterKeyReveal from './MasterKeyReveal';
import MasterKeyConfirm from './MasterKeyConfirm';

const NAMES = {
  REVEAL: 'REVEAL',
  DOWNLOAD: 'DOWNLOAD',
  CONFIRM: 'CONFIRM',
  TRANSFER: 'TRANSFER',
};

const VIEWS = {
  [NAMES.REVEAL]: MasterKeyReveal,
  [NAMES.DOWNLOAD]: MasterKeyDownload,
  [NAMES.CONFIRM]: MasterKeyConfirm,
  [NAMES.TRANSFER]: MasterKeyTransfer,
};

export default function ActivateMasterKey() {
  // pull the reset function out of the 'activate' router
  const { reset: resetActivateRouter } = useLocalRouter();
  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.REVEAL }],
  });

  return (
    <View inset>
      <LocalRouterProvider value={router}>
        <Route resetActivateRouter={resetActivateRouter} />
      </LocalRouterProvider>
    </View>
  );
}
