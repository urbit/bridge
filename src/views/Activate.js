import React, { useEffect } from 'react';

import useRouter from 'lib/useRouter';
import { LocalRouterProvider } from 'lib/LocalRouter';
import { useSyncDates } from 'lib/useSyncPoints';

import { ActivateFlowProvider } from './Activate/ActivateFlow';
import useActivateFlowState from './Activate/useActivateFlowState';
import ActivateCode from './Activate/ActivateCode';
import ActivateMasterKey from './Activate/ActivateMasterKey';
import Disclaimer from './Disclaimer';

const NAMES = {
  CODE: 'CODE',
  DISCLAIMER: 'DISCLAIMER',
  MASTER_KEY: 'MASTER_KEY',
};

const VIEWS = {
  [NAMES.CODE]: ActivateCode,
  [NAMES.DISCLAIMER]: Disclaimer,
  [NAMES.MASTER_KEY]: ActivateMasterKey,
};

export default function Activate() {
  const state = useActivateFlowState();
  const { Route, ...router } = useRouter({
    names: NAMES,
    views: VIEWS,
    initialRoutes: [{ key: NAMES.CODE }],
  });

  useEffect(() => {
    // remove potential /activate path on unmount
    return () => {
      window.history.replaceState(null, null, '');
    };
  }, []);

  // when we know the derived point, ensure we have the data to display it
  useSyncDates([state.derivedPoint.getOrElse(null)].filter(p => p !== null));

  return (
    <LocalRouterProvider value={router}>
      <ActivateFlowProvider value={state}>
        <Route />
      </ActivateFlowProvider>
    </LocalRouterProvider>
  );
}
