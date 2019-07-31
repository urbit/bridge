import React from 'react';

import useRouter from 'lib/useRouter';

import { ActivateFlowProvider } from './Activate/ActivateFlow';
import useActivateFlowState from './Activate/useActivateFlowState';
import ActivateCode from './Activate/ActivateCode';
import { LocalRouterProvider } from 'lib/LocalRouter';
import ActivatePassport from './Activate/ActivatePassport';
import Disclaimer from './Disclaimer';

const NAMES = {
  CODE: 'CODE',
  DISCLAIMER: 'DISCLAIMER',
  PASSPORT: 'PASSPORT',
};

const VIEWS = {
  [NAMES.CODE]: ActivateCode,
  [NAMES.PASSPORT]: ActivatePassport,
  [NAMES.DISCLAIMER]: Disclaimer,
};

export default function Activate() {
  const state = useActivateFlowState();
  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.CODE }],
  });

  return (
    <LocalRouterProvider value={router}>
      <ActivateFlowProvider value={state}>
        <Route />
      </ActivateFlowProvider>
    </LocalRouterProvider>
  );
}
