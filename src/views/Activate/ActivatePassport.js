import React, { useMemo } from 'react';
import cn from 'classnames';
import { Grid } from 'indigo-react';

import { LocalRouterProvider, useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';
import Passport from 'components/Passport';

import { useActivateFlow } from './ActivateFlow';
import useBreakpoints from 'lib/useBreakpoints';
import useRouter from 'lib/useRouter';

import PassportDownload from './PassportDownload';
import PassportVerify from './PassportVerify';
import PassportTransfer from './PassportTransfer';
import { walletFromMnemonic } from 'lib/wallet';
import { DEFAULT_HD_PATH } from 'lib/constants';
import { publicToAddress } from 'ethereumjs-util';

const NAMES = {
  DOWNLOAD: 'DOWNLOAD',
  VERIFY: 'VERIFY',
  TRANSFER: 'TRANSFER',
};

const VIEWS = {
  [NAMES.DOWNLOAD]: PassportDownload,
  [NAMES.VERIFY]: PassportVerify,
  [NAMES.TRANSFER]: PassportTransfer,
};

export default function ActivatePassport() {
  const { derivedPoint, generated, derivedWallet } = useActivateFlow();
  // pull the reset function out of the 'activate' router
  const { reset: resetActivateRouter } = useLocalRouter();
  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.DOWNLOAD }],
  });

  const gap = useBreakpoints([4, 4, 7]);
  const marginTop = useBreakpoints([false, false, 8]);

  // addresses are not derived until we set[Urbit]Wallet(), so do that inline
  const address = useMemo(
    () =>
      derivedWallet
        .chain(wallet =>
          walletFromMnemonic(
            wallet.ownership.seed,
            DEFAULT_HD_PATH,
            wallet.meta.passphrase
          )
        )
        .map(wallet => publicToAddress(wallet.publicKey).toString('hex')),
    [derivedWallet]
  );
  //~hobbyn-mismur-fonrux-datber
  return (
    <View inset>
      <LocalRouterProvider value={router}>
        <Grid gap={gap} className="mt8 mb10">
          <Grid.Item full>
            <Passport
              className={cn({ [`mt${marginTop}`]: marginTop })}
              point={derivedPoint}
              ticket={generated}
              address={address}
            />
          </Grid.Item>
          <Grid.Item
            full
            as={Route}
            resetActivateRouter={resetActivateRouter}
          />
        </Grid>
      </LocalRouterProvider>
    </View>
  );
}
