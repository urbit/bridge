import { useCallback, useState } from 'react';
import ob from 'urbit-ob';

import SolarisClient from 'lib/SolarisClient';
import useDeepEqualReference from './useDeepEqualReference';

const STATE = {
  NOT_FOUND: 'NOT_FOUND',
  RUNNING: 'RUNNING',
  BOOTING: 'BOOTING',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  UNKNOWN: 'UNKNOWN',
};

export function useHostedShip(point, endpoint = 'http://localhost:3030') {
  const patp = ob.patp(point.value);
  const client = new SolarisClient(endpoint);

  const [state, setState] = useState(STATE.UNKNOWN);
  const [events, setEvents] = useState([]);
  const [error, _setError] = useState();

  const setError = useCallback(
    error => {
      _setError(error);
      setState(STATE.UNKNOWN);
      if (error) {
        console.error(error);
      }
    },
    [_setError]
  );

  const addEvent = event => {
    setEvents(current => current.push(event));
  };

  const notFound = state === STATE.NOT_FOUND;
  const running = state === STATE.RUNNING;
  const booting = state === STATE.BOOTING;
  const connecting = state === STATE.CONNECTING;
  const connected = state === STATE.CONNECTED;
  const unknown = state === STATE.UNKNOWN;

  const checkShipExists = useCallback(async () => {
    try {
      setError(undefined);

      const response = await client.getShipsByPatp(patp);

      if (response.status === 404) {
        setState(STATE.NOT_FOUND);
      } else if (!response.ok) {
        setError(response.statusText);
      } else {
        const ship = await response.json();

        if (ship.status === 'Running') {
          setState(STATE.RUNNING);
        } else {
          setError(ship);
        }
      }
    } catch (error) {
      setError(error);
    }
  }, [client, patp, setError]);

  const getShipEvents = useCallback(async () => {
    try {
      setError(undefined);
      setState(STATE.CONNECTING);

      const response = await client.getShipsByPatpEvents(patp);

      if (!response.ok) {
        setError(response.statusText);
      } else {
        const reader = response.body.getReader();

        reader.read().then(function yieldEvent({ done, value }) {
          setState(STATE.CONNECTED);

          // Result objects contain two properties:
          // done  - true if the stream has already given you all its data.
          // value - some data. Always undefined when done is true.
          if (done) {
            return;
          }

          addEvent(JSON.parse(value));

          // Read some more, and call this function again
          return reader.read().then(yieldEvent);
        });
      }
    } catch (error) {
      setError(error);
    }
  }, [client, patp, setError]);

  const createNewShip = useCallback(async () => {
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
        checkShipExists();
      }
    } catch (error) {
      setError(error);
    }
  }, [checkShipExists, client, patp, setError]);

  const values = useDeepEqualReference({
    error,
    notFound,
    running,
    booting,
    connecting,
    connected,
    unknown,
    events,
    checkShipExists,
    getShipEvents,
    createNewShip,
  });

  return { ...values, bind: values };
}
