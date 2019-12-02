import React from 'react';

import useRouter from 'lib/useRouter';
import { LocalRouterProvider } from 'lib/LocalRouter';
import { useSyncKnownPoints } from 'lib/useSyncPoints';

import { ActivateFlowProvider } from './Activate/ActivateFlow';
import useActivateFlowState from './Activate/useActivateFlowState';
import ActivateCode from './Activate/ActivateCode';
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

  // when we know the derived point, ensure we have the data to display it
  useSyncKnownPoints(
    [state.derivedPoint.getOrElse(null)].filter(p => p !== null)
  );

  return (
    <LocalRouterProvider value={router}>
      <ActivateFlowProvider value={state}>
        <Route />
      </ActivateFlowProvider>
    </LocalRouterProvider>
  );
}
