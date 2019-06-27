import React from 'react';

import useRouter from 'lib/useRouter';

import { ActivateFlowProvider } from './Activate/ActivateFlow';
import useActivateFlowState from './Activate/useActivateFlowState';
import ActivateCode from './Activate/ActivateCode';
import ActivateDisclaimer from './Activate/ActivateDisclaimer';
import { LocalRouterProvider } from 'lib/LocalRouter';
import ActivatePassport from './Activate/ActivatePassport';

const kActivateNames = {
  CODE: 'CODE',
  DISCLAIMER: 'DISCLAIMER',
  PASSPORT: 'PASSPORT',
};

const kActivateViews = {
  [kActivateNames.CODE]: ActivateCode,
  [kActivateNames.DISCLAIMER]: ActivateDisclaimer,
  [kActivateNames.PASSPORT]: ActivatePassport,
};

export default function Activate() {
  const state = useActivateFlowState();
  const { Route, ...router } = useRouter({
    names: kActivateNames,
    views: kActivateViews,
    initialRoutes: [{ key: kActivateNames.CODE }],
  });

  return (
    <LocalRouterProvider value={router}>
      <ActivateFlowProvider value={state}>
        <Route />
      </ActivateFlowProvider>
    </LocalRouterProvider>
  );
}
