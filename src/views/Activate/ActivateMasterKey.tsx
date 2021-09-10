import { LocalRouterProvider, useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';

import useRouter from 'lib/useRouter';

import MasterKeyDownload from './MasterKeyDownload';
import PassportTransfer from './PassportTransfer';
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
  [NAMES.TRANSFER]: PassportTransfer,
};

export default function ActivateMasterKey() {
  // pull the reset function out of the 'activate' router
  const { reset: resetActivateRouter } = useLocalRouter();
  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.REVEAL }],
  });

  // TODO
  // addresses are not derived until we set[Urbit]Wallet(), so do that inline
  // const address = useMemo(
  //   () =>
  //     derivedWallet
  //       .chain(wallet =>
  //         walletFromMnemonic(
  //           wallet.ownership.seed,
  //           DEFAULT_HD_PATH,
  //           wallet.meta.passphrase
  //         )
  //       )
  //       .map(wallet => publicToAddress(wallet.publicKey)),
  //   [derivedWallet]
  // );

  return (
    <View inset>
      <LocalRouterProvider value={router}>
        <Route resetActivateRouter={resetActivateRouter} />
      </LocalRouterProvider>
    </View>
  );
}
