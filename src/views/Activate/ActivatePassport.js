import React, { useMemo } from 'react';
import cn from 'classnames';
import Maybe from 'folktale/maybe';
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
import {
  walletFromMnemonic,
  DEFAULT_HD_PATH,
  addressFromSecp256k1Public,
} from 'lib/wallet';

const kPassportNames = {
  DOWNLOAD: 'DOWNLOAD',
  VERIFY: 'VERIFY',
  TRANSFER: 'TRANSFER',
};

const kPassportViews = {
  [kPassportNames.DOWNLOAD]: PassportDownload,
  [kPassportNames.VERIFY]: PassportVerify,
  [kPassportNames.TRANSFER]: PassportTransfer,
};

export default function ActivatePassport() {
  const { derivedPoint, generated, derivedWallet } = useActivateFlow();
  // pull the reset function out of the 'activate' router
  const { reset: resetActivateRouter } = useLocalRouter();
  const { Route, ...router } = useRouter({
    names: kPassportNames,
    views: kPassportViews,
    initialRoutes: [{ key: kPassportNames.DOWNLOAD }],
  });

  const fullView = useBreakpoints([false, false, true]);
  const gap = useBreakpoints([4, 4, 7]);
  const marginTop = useBreakpoints([false, false, 8]);
  const full = useBreakpoints([true, true, false]);
  const leftHalf = useBreakpoints([false, false, 1]);
  const rightHalf = useBreakpoints([false, false, 2]);

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
        .map(wallet => addressFromSecp256k1Public(wallet.publicKey)),
    [derivedWallet]
  );

  return (
    <LocalRouterProvider value={router}>
      <View full={fullView}>
        <Grid gap={gap} className="mt8 mb10">
          <Grid.Item half={leftHalf} full={full}>
            <Passport
              className={cn({ [`mt${marginTop}`]: marginTop })}
              point={derivedPoint}
              ticket={generated}
              address={address}
            />
          </Grid.Item>
          <Grid.Item
            half={rightHalf}
            full={full}
            as={Route}
            resetActivateRouter={resetActivateRouter}
          />
        </Grid>
      </View>
    </LocalRouterProvider>
  );
}
