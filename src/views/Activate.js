import React from 'react';

import useRouter from 'lib/useRouter';

import { ActivateFlowProvider } from './Activate/ActivateFlow';
import useActivateFlowState from './Activate/useActivateFlowState';
import ActivateCode from './Activate/ActivateCode';
import ActivateDisclaimer from './Activate/ActivateDisclaimer';
import { LocalRouterProvider } from 'lib/LocalRouter';
import ActivatePassport from './Activate/ActivatePassport';

const NAMES = {
  CODE: 'CODE',
  DISCLAIMER: 'DISCLAIMER',
  PASSPORT: 'PASSPORT',
};

const VIEWS = {
  [NAMES.CODE]: ActivateCode,
  [NAMES.DISCLAIMER]: ActivateDisclaimer,
  [NAMES.PASSPORT]: ActivatePassport,
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
