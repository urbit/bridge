import { useEffect } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { IndigoApp } from 'indigo-react';

import Router from 'components/Router';

import Provider from 'store/Provider';

import { ROUTE_NAMES } from 'lib/routeNames';
import { ROUTES } from 'lib/router';
import { NETWORK_TYPES } from 'lib/network';
import { walletFromMnemonic } from 'lib/wallet';
import { isDevelopment, isMainnet, isGoerli } from 'lib/flags';
import useImpliedTicket from 'lib/useImpliedTicket';
import useHasDisclaimed from 'lib/useHasDisclaimed';

import 'style/index.scss';
import { ThemeProvider } from 'styled-components';
import light from '@tlon/indigo-light';

import WithErrorBoundary from 'components/WithErrorBoundary';
import GlobalErrorBoundary from 'components/GlobalErrorBoundary';
import { useBrowser } from 'lib/useBrowser';
import { BrowserWarning } from 'components/BrowserWarning';

import Modal from 'components/L2/Modal';
import { useRollerStore } from 'store/rollerStore';
import { Box } from '@tlon/indigo-react';
import LoadingOverlay from 'components/L2/LoadingOverlay';
import { useRollerPoller } from 'lib/useRollerPoller';

const INITIAL_NETWORK_TYPE = isGoerli
  ? NETWORK_TYPES.GOERLI
  : isDevelopment && !isMainnet
    ? NETWORK_TYPES.LOCAL
    : NETWORK_TYPES.MAINNET;

// NB(shrugs): modify these variables to change the default local state.
const SHOULD_STUB_LOCAL = import.meta.env.VITE_STUB_LOCAL === 'true';
const IS_STUBBED = isDevelopment && SHOULD_STUB_LOCAL;

const INITIAL_WALLET = IS_STUBBED
  ? walletFromMnemonic(
    import.meta.env.VITE_DEV_MNEMONIC as string,
    import.meta.env.VITE_HD_PATH as string
  )
  : undefined;
const INITIAL_MNEMONIC = IS_STUBBED
  ? Just(import.meta.env.VITE_DEV_MNEMONIC)
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

function Poller() {
  useRollerPoller();

  return null;
}

function Bridge() {
  const initialRoutes = useInitialRoutes();
  const { loading, modalText, setModalText } = useRollerStore();

  const browser = useBrowser();
  const showBrowserWarning = browser && !browser.isChromium;

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
    <WithErrorBoundary
      render={(error: Error) => <GlobalErrorBoundary error={error} />}>
      <Provider
        views={ROUTES}
        names={ROUTE_NAMES}
        initialRoutes={initialRoutes}
        initialNetworkType={INITIAL_NETWORK_TYPE}
        initialWallet={INITIAL_WALLET}
        initialMnemonic={INITIAL_MNEMONIC}
        initialPointCursor={INITIAL_POINT_CURSOR}>
        <BrowserWarning show={!!showBrowserWarning} />
        <IndigoApp>
          <ThemeProvider theme={light}>
            <Router />
          </ThemeProvider>
        </IndigoApp>
        <Modal show={modalText !== undefined} hide={() => setModalText('')}>
          <Box width="280px">{modalText}</Box>
        </Modal>
        <LoadingOverlay loading={loading} />
        <Poller />
      </Provider>
    </WithErrorBoundary>
  );
}

export default Bridge;
