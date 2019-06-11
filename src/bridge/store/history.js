import React, {
  createContext,
  forwardRef,
  useContext,
  useState,
  useEffect,
} from 'react';
import { last, includes } from 'lodash';

import { BRIDGE_ERROR } from '../lib/error';
import { ROUTE_NAMES } from '../lib/routeNames';

export const HistoryContext = createContext(null);

function _useHistory(initialRoutes = []) {
  const [history, setHistory] = useState(initialRoutes);

  const value = {
    routes: history,
    push: (name, data) => {
      if (!includes(ROUTE_NAMES, name)) {
        throw BRIDGE_ERROR.INVALID_ROUTE;
      }

      setHistory(history => [...history, { name, data }]);
    },
    popAndPush: (name, data = {}) =>
      setHistory(history => [
        ...history.slice(0, history.length - 1),
        { name, data },
      ]),
    pop: (count = 1) =>
      setHistory(history => [...history.slice(0, history.length - count)]),
    peek: () => last(history),
    size: history.length,
    includes: name => includes(history.map(r => r.name), name),
    data: last(history).data,
  };

  // Scroll to top of page with each route transition.
  useEffect(() => window.scrollTo(0, 0), [history]);

  // set up handlers
  useEffect(() => {
    window.history.pushState(null, null, null);

    window.onpopstate = e => {
      window.history.pushState(null, null, null);
      value.pop();
    };

    // TODO: disposer functon
  });

  return value;
}

export function HistoryProvider({ initialRoutes, children }) {
  const history = _useHistory(initialRoutes);

  return (
    <HistoryContext.Provider value={history}>
      {children}
    </HistoryContext.Provider>
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
      {history => <Component ref={ref} history={history} {...props} />}
    </HistoryContext.Consumer>
  ));
