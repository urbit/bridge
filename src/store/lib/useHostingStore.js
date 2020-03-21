import { useState, useCallback, useMemo } from 'react';
import { Nothing } from 'folktale/maybe';
import * as ob from 'urbit-ob';

import { getVaneName, getVaneNumber } from 'lib/hosting';
import SolarisClient from 'lib/SolarisClient';

import { usePointCursor } from 'store/pointCursor';

const STATE = {
  UNKNOWN: 'UNKNOWN',
  MISSING: 'MISSING',
  RUNNING: 'RUNNING',
  PENDING: 'PENDING',
};

function useHostingStore(url, domain, disabled) {
  const client = new SolarisClient(url);

  const { pointCursor } = usePointCursor();

  const [bootProgress, setBootProgress] = useState(0);
  const [bootMessage, setBootMessage] = useState('Assembling Urbit');
  const [startTime] = useState(Date.now());

  const [status, _setStatus] = useState(STATE.UNKNOWN);
  const setStatus = useCallback(
    s => {
      _setStatus(s);
    },
    [_setStatus]
  );

  const [sysEvents, setSysEvents] = useState([]);
  const [newEvents, setNewEvents] = useState([]);
  const [runEvents, setRunEvents] = useState([]);

  const [error, _setError] = useState();
  const setError = useCallback(
    error => {
      _setError(error);
      if (error) {
        setStatus(STATE.UNKNOWN);
        console.error(error);
      }
    },
    [_setError, setStatus]
  );

  const unknown = status === STATE.UNKNOWN;
  const missing = status === STATE.MISSING;
  const running = status === STATE.RUNNING;
  const pending = status === STATE.PENDING;

  let syncStatus;

  const resetEvents = useCallback(() => {
    setSysEvents([]);
    setNewEvents([]);
    setRunEvents([]);
  }, [setSysEvents, setNewEvents, setRunEvents]);

  const getEvents = useCallback(() => {
    try {
      if (Nothing.hasInstance(pointCursor) || disabled) {
        return;
      }
      const patp = ob.patp(pointCursor.value);
      setError(undefined);

      resetEvents();

      const url = client.getShipsByPatpUrl(patp) + '/events';
      const source = new EventSource(url);

      source.addEventListener('sys', event => {
        const sysEvent = JSON.parse(event.data);
        const time = new Date(sysEvent.object.firstTimestamp).getTime();
        if (time > startTime) {
          setSysEvents(previous => [...previous, sysEvent]);
        }
      });

      source.addEventListener('new', event => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (event.data !== '') {
          setNewEvents(previous => [...previous, event.data]);
        }
        if (event.data === '1-b') {
          setBootMessage('Compiling Hoon');
          setBootProgress(0.2);
        } else if (event.data === '1-c') {
          setBootProgress(0.25);
        } else if (event.data === '%arvo-assembly') {
          setBootMessage('Compiling Urbit OS');
          setBootProgress(0.3);
        } else if (event.data.startsWith('[%vane %')) {
          const vane = getVaneName(event.data.slice(8, 9));
          setBootMessage(`Compiling vane: ${vane}`);
          setBootProgress(0.3 + 0.05 * getVaneNumber(event.data.slice(8, 9)));
        } else if (event.data === 'pier: boot complete') {
          setBootMessage('Ship starting');
          setBootProgress(0.85);
        }
      });

      source.addEventListener('run', event => {
        if (event.data === 'goad: recompiling all apps') {
          setBootProgress(1.0);
          setBootMessage('Ship Launched');
          syncStatus();
        }
        if (event.data !== '') {
          setRunEvents(previous => [...previous, event.data]);
        }
      });
    } catch (error) {
      setError(error);
    }
  }, [
    setError,
    disabled,
    resetEvents,
    client,
    pointCursor,
    setBootMessage,
    startTime,
    syncStatus,
  ]);

  syncStatus = useCallback(async () => {
    try {
      if (Nothing.hasInstance(pointCursor) || disabled) {
        return;
      }
      const patp = ob.patp(pointCursor.value);
      setError(undefined);

      resetEvents();

      const response = await client.getShipsByPatp(patp);

      if (response.status === 404) {
        setStatus(STATE.MISSING);
      } else if (!response.ok) {
        setError(response.statusText);
      } else {
        const ship = await response.json();

        if (ship.status === 'Pending') {
          setStatus(STATE.PENDING);
          getEvents();
        } else if (ship.status === 'Running') {
          setStatus(STATE.RUNNING);
        } else {
          setError(ship);
        }
      }
    } catch (error) {
      setError(error);
    }
  }, [
    client,
    getEvents,
    pointCursor,
    resetEvents,
    setError,
    setStatus,
    disabled,
  ]);

  const hostedShipUrl = useMemo(
    () => `http://${ob.patp(pointCursor.getOrElse('')).slice(1)}.${domain}`,
    [pointCursor, domain]
  );

  const create = useCallback(
    async keyfile => {
      try {
        if (Nothing.hasInstance(pointCursor) || disabled) {
          return;
        }
        const patp = ob.patp(pointCursor.value).slice(1);
        setError(undefined);

        const start = Date.now();
        setStatus(STATE.PENDING);
        setBootProgress(0.1);

        const response = await client.postShips({
          patp,
          key: keyfile,
          debug: true,
          fake: false,
        });

        if (!response.ok) {
          setError(response.statusText);
        } else {
          getEvents();
        }
      } catch (error) {
        setError(error);
      }
    },
    [pointCursor, setError, setStatus, client, getEvents, disabled]
  );

  return {
    error,
    unknown,
    missing,
    running,
    pending,
    url: hostedShipUrl,

    sysEvents,
    newEvents,
    runEvents,

    syncStatus,
    getEvents,
    create,

    bootProgress,
    bootMessage,

    disabled,
    // debugging
    status,
  };
}

export default useHostingStore;
