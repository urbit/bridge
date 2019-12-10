import { useCallback, useState } from 'react';

const STATE = {
  // container states
  UNKNOWN: 'UNKNOWN',
  MISSING: 'MISSING',
  RUNNING: 'RUNNING',
  PENDING: 'PENDING',
  // api states
  QUERYING: 'QUERYING',
  BOOTING: 'BOOTING',
  CONNECTING: 'CONNECTING',
  // connection states
  CONNECTED: 'CONNECTED',
};

export function useHostedShip(client, patp) {
  const [state, _setState] = useState(STATE.UNKNOWN);
  const setState = useCallback(
    s => {
      console.log(s);
      _setState(s);
    },
    [_setState]
  );

  const [sysEvents, setSysEvents] = useState([]);
  const [newEvents, setNewEvents] = useState([]);
  const [runEvents, setRunEvents] = useState([]);

  const [error, _setError] = useState();
  const setError = useCallback(
    error => {
      _setError(error);
      if (error) {
        setState(STATE.UNKNOWN);
        console.error(error);
      }
    },
    [_setError, setState]
  );

  const unknown = state === STATE.UNKNOWN;
  const missing = state === STATE.MISSING;
  const running = state === STATE.RUNNING;
  const pending = state === STATE.PENDING;
  const querying = state === STATE.QUERYING;
  const booting = state === STATE.BOOTING;
  const connecting = state === STATE.CONNECTING;
  const connected = state === STATE.CONNECTED;

  const resetEvents = useCallback(() => {
    setSysEvents([]);
    setNewEvents([]);
    setRunEvents([]);
  }, []);

  const getStatus = useCallback(async () => {
    try {
      setError(undefined);

      resetEvents();

      setState(STATE.QUERYING);

      const response = await client.getShipsByPatp(patp);

      if (response.status === 404) {
        setState(STATE.MISSING);
      } else if (!response.ok) {
        setError(response.statusText);
      } else {
        const ship = await response.json();

        if (ship.status === 'Pending') {
          setState(STATE.PENDING);
        } else if (ship.status === 'Running') {
          setState(STATE.RUNNING);
        } else {
          setError(ship);
        }
      }
    } catch (error) {
      setError(error);
    }
  }, [client, patp, resetEvents, setError]);

  const getEvents = useCallback(() => {
    try {
      setError(undefined);

      resetEvents();

      setState(STATE.CONNECTING);

      const url = client.getShipsByPatpUrl(patp) + '/events';
      const source = new EventSource(url);

      source.onopen = () => setState(STATE.CONNECTED);
      // source.onerror = () => setState(STATE.UNKNOWN);
      // source.onmessage = console.log;

      source.addEventListener('sys', event => {
        setSysEvents(previous => [...previous, JSON.parse(event.data)]);
      });

      source.addEventListener('new', event => {
        if (event.data !== '') {
          setNewEvents(previous => [...previous, event.data]);
        }
      });

      source.addEventListener('run', event => {
        if (event.data !== '') {
          setRunEvents(previous => [...previous, event.data]);
        }
      });
    } catch (error) {
      setError(error);
    }
  }, [setError, resetEvents, client, patp, setState]);

  const create = useCallback(async () => {
    try {
      setError(undefined);

      setState(STATE.BOOTING);

      const response = await client.postShips({
        patp,
        key: '123',
      });

      if (!response.ok) {
        setError(response.statusText);
      } else {
        getEvents();
      }
    } catch (error) {
      setError(error);
    }
  }, [setError, client, patp, getEvents]);

  return {
    error,
    unknown,
    missing,
    running,
    pending,
    querying,
    booting,
    connecting,
    connected,

    sysEvents,
    newEvents,
    runEvents,

    getStatus,
    getEvents,
    create,

    // debugging
    state,
  };
}
