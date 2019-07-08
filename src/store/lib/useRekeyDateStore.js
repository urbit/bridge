import { useCallback, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { useNetwork } from '../network';

export default function useRekeyDateStore() {
  const { web3 } = useNetwork();
  const [rekeyDateCache, _setRekeyDateCache] = useState({});

  const addToRekeyDateCache = useCallback(
    entry =>
      _setRekeyDateCache(cache => ({
        ...cache,
        ...entry,
      })),
    [_setRekeyDateCache]
  );

  const getRekeyDate = useCallback(
    point => rekeyDateCache[point] || Nothing(),
    [rekeyDateCache]
  );

  const syncRekeyDate = useCallback(
    async point => {
      const _web3 = web3.getOrElse(null);
      if (!_web3) {
        return;
      }

      //TODO tighter search?
      //TODO maybe move into azimuth-js?
      const logs = await azimuth.azimuth.getPastEvents('ChangedKeys', {
        fromBlock: 0,
        toBlock: 'latest',
        filter: { point: [point] },
      });

      if (logs.length === 0) {
        //TODO: better encoding for "no rekeyDate" state?
        addToRekeyDateCache({
          [point]: Just('unknown'),
        });
      } else {
        // last log is most recent
        const blockNumber = logs[logs.length - 1].blockNumber;
        const block = await _web3.eth.getBlock(blockNumber);
        addToRekeyDateCache({
          //TODO date format
          [point]: Just(new Date(block.timestamp * 1000).toString()),
        });
      }
    },
    [web3, addToRekeyDateCache]
  );

  return { getRekeyDate, syncRekeyDate };
}
