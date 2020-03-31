import { useState, useMemo, useEffect } from 'react';
import { Nothing } from 'folktale/maybe';

import { usePointCursor } from 'store/pointCursor';

import { HOSTING_STATUS } from 'lib/hosting';
import * as need from 'lib/need';
import * as ob from 'urbit-ob';

export function useLocalHostingStore() {
  const { pointCursor } = usePointCursor();

  const patp = useMemo(() => pointCursor.map(point => ob.patp(point)), [
    pointCursor,
  ]);
  const url = patp.map(p => `https://${p.slice(1)}.arvo.network`).getOrElse('');

  const [status, setStatus] = useState(HOSTING_STATUS.UNKNOWN);

  useEffect(() => {
    if (Nothing.hasInstance(pointCursor)) {
      return;
    }
    fetch(`${url}/who.json`)
      .then(r => r.json())
      .then(r => {
        const point = need.point(pointCursor);
        if (ob.patp(point).slice(1) === r.who) {
          setStatus(HOSTING_STATUS.RUNNING);
        } else {
          setStatus(HOSTING_STATUS.MISSING);
        }
      })
      .catch(e => {
        setStatus(HOSTING_STATUS.MISSING);
      });
  }, [pointCursor, url]);

  const disabled = useMemo(() => status !== HOSTING_STATUS.RUNNING, [status]);

  return { disabled, status, url, hostName: null };
}
