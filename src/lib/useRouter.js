import { useCallback, useMemo, useState, useEffect } from 'react';
import { last, includes as _includes } from 'lodash';

/**
 * @param primary whether or not this is the top-level router
 * @param names map of string to view key, used for consumer references
 * @param views map of view keys to react component views
 * @param initialRoutes initial set of routes following the { key, data } format
 */
export default function useRouter({
  primary = false,
  names = {},
  views = {},
  initialRoutes = [],
}) {
  const [routes, setRoutes] = useState(initialRoutes);

  const push = useCallback(
    (key, data) => {
      if (!views[key]) {
        throw new Error(
          `Invalid Route: ${key}. Possible Routes: ${Object.keys(views).join(
            ', '
          )}`
        );
      }
      setRoutes(routes => [...routes, { key, data }]);
    },
    [setRoutes, views]
  );
  const popAndPush = useCallback(
    (key, data = {}) => {
      if (!views[key]) {
        throw new Error(
          `Invalid Route: ${key}. Possible Routes: ${Object.keys(views).join(
            ', '
          )}`
        );
      }

      setRoutes(routes => [
        ...routes.slice(0, routes.length - 1),
        { key, data },
      ]);
    },
    [setRoutes, views]
  );
  const pop = useCallback(
    (count = 1) =>
      setRoutes(routes =>
        routes.length > 1 ? [...routes.slice(0, routes.length - count)] : routes
      ),
    // ^ can't pop root route
    [setRoutes]
  );
  const peek = useCallback(() => last(routes), [routes]);
  const replaceWith = useCallback(routes => setRoutes(() => routes), [
    setRoutes,
  ]);
  const reset = useCallback(() => setRoutes(initialRoutes), [
    setRoutes,
    initialRoutes,
  ]);
  const includes = useCallback(key => _includes(routes.map(r => r.key), key), [
    routes,
  ]);
  const size = routes.length;
  const data = useMemo(() => last(routes).data, [routes]);
  const Route = useMemo(() => views[peek().key], [views, peek]);

  // Scroll to top of page with each route transition
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [routes, primary]);

  // capture browser pop in primary router
  useEffect(() => {
    if (!primary) {
      return;
    }

    window.history.pushState(null, null, null);

    window.onpopstate = e => {
      window.history.pushState(null, null, null);
      pop();
    };

    // TODO: disposer functon
  }, [pop, primary]);

  return {
    Route,
    names,
    routes,
    push,
    popAndPush,
    pop,
    replaceWith,
    reset,
    peek,
    size,
    includes,
    data,
  };
}
