import React from 'react';
import { useEffect } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { IndigoApp } from 'indigo-react';

import Router from 'components/Router';

import Provider from 'store/Provider';

import { ROUTE_NAMES } from 'lib/routeNames';
import { ROUTES } from 'lib/router';
import { NETWORK_TYPES } from 'lib/network';
import { walletFromMnemonic } from 'lib/wallet';
import { isDevelopment, isMainnet, isRopsten } from 'lib/flags';
import useImpliedTicket from 'lib/useImpliedTicket';
import useHasDisclaimed from 'lib/useHasDisclaimed';

import 'style/index.scss';
import WithErrorBoundary from 'components/WithErrorBoundary';
import GlobalErrorBoundary from 'components/GlobalErrorBoundary';
import Modal from 'components/L2/Modal';
import { useRollerStore } from 'store/rollerStore';
import { Box } from '@tlon/indigo-react';
import LoadingOverlay from 'components/L2/LoadingOverlay';

const INITIAL_NETWORK_TYPE = isRopsten
  ? NETWORK_TYPES.ROPSTEN
  : isDevelopment && !isMainnet
  ? NETWORK_TYPES.LOCAL
  : NETWORK_TYPES.MAINNET;

// NB(shrugs): modify these variables to change the default local state.
const SHOULD_STUB_LOCAL = process.env.REACT_APP_STUB_LOCAL === 'true';
const IS_STUBBED = isDevelopment && SHOULD_STUB_LOCAL;

const INITIAL_WALLET = IS_STUBBED
  ? walletFromMnemonic(
      process.env.REACT_APP_DEV_MNEMONIC,
      process.env.REACT_APP_HD_PATH
    )
  : undefined;
const INITIAL_MNEMONIC = IS_STUBBED
  ? Just(process.env.REACT_APP_DEV_MNEMONIC)
  : Nothing();
const INITIAL_POINT_CURSOR = IS_STUBBED ? Just(65792) : Nothing();

function useInitialRoutes() {
  const [hasDisclaimed] = useHasDisclaimed();
  const { impliedTicket } = useImpliedTicket();

  const isActivateUrl = window.location.pathname === '/activate';

  if (IS_STUBBED) {
    return [
      { key: ROUTE_NAMES.LOGIN },
      // { key: ROUTE_NAMES.POINTS },
      // { key: ROUTE_NAMES.POINT },
    ];
  }

  if (impliedTicket || isActivateUrl) {
    return [{ key: ROUTE_NAMES.ACTIVATE }];
  }

  if (!hasDisclaimed) {
    return [{ key: ROUTE_NAMES.DISCLAIMER, data: { next: ROUTE_NAMES.LOGIN } }];
  }

  return [{ key: ROUTE_NAMES.LOGIN }];
}

function Bridge() {
  const initialRoutes = useInitialRoutes();
  const { loading, modalText, setModalText } = useRollerStore();

  //  full reload if the user changes their selected network in Metamask
  //
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        document.location.reload();
      });
    }
  }, []);

  return (
    <WithErrorBoundary render={error => <GlobalErrorBoundary error={error} />}>
      <Provider
        views={ROUTES}
        names={ROUTE_NAMES}
        initialRoutes={initialRoutes}
        initialNetworkType={INITIAL_NETWORK_TYPE}
        initialWallet={INITIAL_WALLET}
        initialMnemonic={INITIAL_MNEMONIC}
        initialPointCursor={INITIAL_POINT_CURSOR}>
        <IndigoApp>
          <Router />
        </IndigoApp>
        <Modal show={modalText !== undefined} hide={() => setModalText()}>
          <Box width="280px">{modalText}</Box>
        </Modal>
        <LoadingOverlay loading={loading} />
      </Provider>
    </WithErrorBoundary>
  );
}

export default Bridge;
