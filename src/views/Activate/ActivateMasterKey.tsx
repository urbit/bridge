import React, { useMemo } from 'react';

import { LocalRouterProvider, useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';

import { useActivateFlow } from './ActivateFlow';
import useRouter from 'lib/useRouter';

import MasterKeyDownload from './MasterKeyDownload';
import PassportVerify from './PassportVerify';
import PassportTransfer from './PassportTransfer';
import { walletFromMnemonic } from 'lib/wallet';
import { DEFAULT_HD_PATH } from 'lib/constants';
import { publicToAddress } from 'lib/utils/address';
import MasterKeyReveal from './MasterKeyReveal';

const NAMES = {
  REVEAL: 'REVEAL',
  DOWNLOAD: 'DOWNLOAD',
  VERIFY: 'VERIFY',
  TRANSFER: 'TRANSFER',
};

const VIEWS = {
  [NAMES.REVEAL]: MasterKeyReveal,
  [NAMES.DOWNLOAD]: MasterKeyDownload,
  [NAMES.VERIFY]: PassportVerify,
  [NAMES.TRANSFER]: PassportTransfer,
};

export default function ActivateMasterKey() {
  const { derivedPoint, generated, derivedWallet } = useActivateFlow();
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
