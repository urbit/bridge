import { useState, useEffect, useMemo } from 'react';
import { Just } from 'folktale/maybe';
import * as ob from 'urbit-ob';

import { usePointCursor } from 'store/pointCursor';

const DOMAIN = 'arvo.network';

const STATE = {
  UNKNOWN: 'UNKNOWN',
  MISSING: 'MISSING',
  RUNNING: 'RUNNING',
};

export default function useLocalHosting() {
  const [status, setStatus] = useState(STATE.UNKNOWN);

  const { pointCursor } = usePointCursor();

  useEffect(() => {
    const updateStatus = async point => {
      const patp = ob.patp(point).slice(1);
      try {
        const { who } = await fetch(
          `https://${patp}.${DOMAIN}/who.json`
        ).then(r => r.json());
        if (who === patp) {
          setStatus(STATE.RUNNING);
        } else {
          setStatus(STATE.MISSING);
        }
      } catch (e) {
        setStatus(STATE.MISSING);
      }
    };
    if (Just.hasInstance(pointCursor)) {
      updateStatus(pointCursor.value);
    }
  }, [pointCursor]);

  const url = useMemo(
    () =>
      pointCursor.value &&
      `https://${ob.patp(pointCursor.value).slice(1)}.${DOMAIN}`,
    [pointCursor]
  );

  const running = useMemo(() => status === STATE.RUNNING, [status]);

  return { running, url };
}
