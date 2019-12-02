import React, { useCallback, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, Flex } from 'indigo-react';

import { LocalRouterProvider } from 'lib/LocalRouter';
import useRouter from 'lib/useRouter';

import Steps from 'components/Steps';

import ReticketConfirm from './Reticket/ReticketConfirm';
import ReticketDownload from './Reticket/ReticketDownload';
import ReticketVerify from './Reticket/ReticketVerify';
import ReticketExecute from './Reticket/ReticketExecute';

const NAMES = {
  CONFIRM: 'CONFIRM',
  DOWNLOAD: 'DOWNLOAD',
  VERIFY: 'VERIFY',
  EXECUTE: 'EXECUTE',
};

const VIEWS = {
  CONFIRM: ReticketConfirm,
  DOWNLOAD: ReticketDownload,
  VERIFY: ReticketVerify,
  EXECUTE: ReticketExecute,
};

const STEPS = [NAMES.CONFIRM, NAMES.DOWNLOAD, NAMES.VERIFY, NAMES.RETICKET];

export default function AdminReticket() {
  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.CONFIRM }],
  });

  const [newWallet, _setNewWallet] = useState(Nothing());

  const setNewWallet = useCallback(
    (wallet, paper) => {
      _setNewWallet(
        Just({
          wallet,
          paper,
        })
      );
    },
    [_setNewWallet]
  );

  return (
    <LocalRouterProvider value={router}>
      <Grid>
        <Grid.Item full as={Flex} row align="center">
          <Flex.Item as={Steps} num={router.size} total={STEPS.length} />
        </Grid.Item>
      </Grid>
      <Route newWallet={newWallet} setNewWallet={setNewWallet} />
    </LocalRouterProvider>
  );
}
