import React, { createContext, forwardRef, useContext } from 'react';

import useRouter from 'lib/useRouter';

/**
 * `useHistory` is just a global `useRouter`
 * and we call it `history` to distinguish it within a local router.
 * (see Invite.js for an example)
 */

export const HistoryContext = createContext(null);

export function HistoryProvider({ names, views, initialRoutes, children }) {
  const router = useRouter({ names, views, initialRoutes, primary: true });

  return (
    <HistoryContext.Provider value={router}>{children}</HistoryContext.Provider>
  );
}

// Hook version
export function useHistory() {
  return useContext(HistoryContext);
}

// HOC version
export const withHistory = Component =>
  forwardRef((props, ref) => (
    <HistoryContext.Consumer>
      {router => <Component ref={ref} history={router} {...props} />}
    </HistoryContext.Consumer>
  ));
