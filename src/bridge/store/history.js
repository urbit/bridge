import React, { useContext, useState, useEffect } from 'react';
import { last, includes } from 'lodash';

import { BRIDGE_ERROR } from '../lib/error';
import { ROUTE_NAMES } from '../lib/routeNames';

export const HistoryContext = React.createContext(null);

export function HistoryProvider({ initialRoutes = [], children }) {
  const [history, setHistory] = useState(initialRoutes);

  const value = {
    routes: history,
    push: (name, data) => {
      if (!includes(ROUTE_NAMES, name)) {
        throw BRIDGE_ERROR.INVALID_ROUTE;
      }

      setHistory([...history, { name, data }]);
    },
    popAndPush: (name, data = {}) =>
      setHistory([...history.slice(0, history.length - 1), { name, data }]),
    pop: (count = 1) =>
      setHistory([...history.slice(0, history.length - count)]),
    peek: () => last(history),
    size: history.length,
    includes: name => includes(history.map(r => r.name), name),
    data: () => last(history).data,
  };

  // Scroll to top of page with each route transition.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [history]);

  useEffect(() => {
    window.history.pushState(null, null, null);

    window.onpopstate = e => {
      window.history.pushState(null, null, null);
      value.pop();
    };
  });

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
}

// HOC version
export const withHistory = Component => props => (
  <HistoryContext.Consumer>
    {history => <Component history={history} {...props} />}
  </HistoryContext.Consumer>
);

// Hook version
export function useHistory() {
  return useContext(HistoryContext);
}
