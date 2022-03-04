import React, {
  createContext,
  forwardRef,
  FunctionComponent,
  useContext,
} from 'react';

import useRouter, { Route, Router } from 'lib/useRouter';
import { LocalRouterProvider } from 'lib/LocalRouter';
import { ROUTE_NAMES } from 'lib/routeNames';

/**
 * `useHistory` is just a global `useRouter`
 * and we call it `history` to distinguish it within a local router.
 * (see Invite.js for an example)
 */

export const HistoryContext = createContext<Router>({} as Router);

interface HistoryProviderProps {
  names: typeof ROUTE_NAMES;
  views: any;
  initialRoutes: Route[];
}

export const HistoryProvider: FunctionComponent<HistoryProviderProps> = ({
  names,
  views,
  initialRoutes,
  children,
}) => {
  const router = useRouter({ names, views, initialRoutes });

  return (
    <HistoryContext.Provider value={router}>
      <LocalRouterProvider value={router}>{children}</LocalRouterProvider>
    </HistoryContext.Provider>
  );
};

// Hook version
export function useHistory() {
  return useContext(HistoryContext);
}

// HOC version
export const withHistory = (Component: any) =>
  forwardRef((props, ref) => (
    <HistoryContext.Consumer>
      {router => <Component ref={ref} history={router} {...props} />}
    </HistoryContext.Consumer>
  ));
