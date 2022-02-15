import { useEffect, useState } from 'react';
import { useRollerStore } from 'store/rollerStore';
import { useTimerStore } from 'store/timerStore';
import { ONE_SECOND, TEN_SECONDS } from './constants';
import useRoller from './useRoller';
import { getTimeToNextBatch } from './utils/roller';

export function useRollerPoller() {
  const { nextBatchTime, setNextBatchTime, setNextRoll } = useTimerStore();
  const { point } = useRollerStore();
  const { api, getInvites, getPendingTransactions } = useRoller();
  const [time, setTime] = useState(ONE_SECOND);

  useEffect(() => {
    const interval = setInterval(async () => {
      const nextRoll = getTimeToNextBatch(nextBatchTime, new Date().getTime());
      setNextRoll(nextRoll);

      if (nextBatchTime - ONE_SECOND <= new Date().getTime()) {
        const response = await api.getRollerConfig();

        if (response.nextBatch === nextBatchTime) {
          // exponentially back off or cap at polling every minute
          setTime(Math.min(60 * ONE_SECOND, time + time));
          return;
        }

        setTime(ONE_SECOND); // reset the timer
        setNextBatchTime(response.nextBatch);
        getPendingTransactions();

        setTimeout(() => {
          if (!point.isDefault) {
            getInvites(); // This will also get pending txns
          }
        }, TEN_SECONDS); // Should this be more like a minute?
      }
    }, time);

    return () => clearInterval(interval);
  }, [time, point, nextBatchTime, getPendingTransactions, getInvites]); // eslint-disable-line react-hooks/exhaustive-deps
}
