import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { last, includes as _includes, findIndex } from 'lodash';

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

  const oldPopState = useRef();

  const size = routes.length;
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
    (count = 1) => {
      if (size > 1) {
        // pop as expected
        return setRoutes(routes => [...routes.slice(0, routes.length - count)]);
      }

      // if we are at the root, pass this event to our parent
      if (oldPopState.current) {
        window.history.back();
      }
    },
    [size, setRoutes, oldPopState]
  );
  const popTo = useCallback(
    name => {
      const index = findIndex(routes, route => route.key === name);
      return pop(routes.length - 1 - index);
    },
    [pop, routes]
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
  const data = useMemo(() => last(routes).data, [routes]);
  const Route = useMemo(() => views[peek().key], [views, peek]);

  // Scroll to top of page with each route transition
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [routes]);

  useEffect(() => {
    // on router mount, register new state with browser
    window.history.pushState(null, null, null);
  }, []);

  // capture browser pop in primary router
  useEffect(() => {
    // store the previous onpopstate handler
    oldPopState.current = window.onpopstate;

    // construct new onpopstate handler
    window.onpopstate = e => {
      if (size <= 1 && oldPopState.current) {
        // if this is the root route and there's a parent handler,
        // give the event to the handler
        return oldPopState.current(e);
      }

      // on pop, tell the browser of a new state to avoid giving the user
      // the ability to go forward
      // TODO: allow the user to go forward by storing our data in history
      // and using the url for other state
      window.history.pushState(null, null, null);

      // then update our local state for rendering
      pop();
    };

    return () => {
      // reset the onpopstate to the previous version
      window.onpopstate = oldPopState.current;
    };
  }, [size, pop, oldPopState]);

  return {
    Route,
    names,
    routes,
    push,
    popAndPush,
    pop,
    popTo,
    replaceWith,
    reset,
    peek,
    size,
    includes,
    data,
  };
}
