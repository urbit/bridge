import { useCallback, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import Result from 'folktale/result';

import { useNetwork } from '../network';

export default function useRekeyDateStore() {
  const { web3, contracts } = useNetwork();
  const [rekeyDateCache, _setRekeyDateCache] = useState({});

  const addToRekeyDateCache = useCallback(
    entry =>
      _setRekeyDateCache(cache => ({
        ...cache,
        ...entry,
      })),
    [_setRekeyDateCache]
  );

  /**
   * @param {number} point
   * @return {Maybe<Result<Date, String>>}
   */
  const getRekeyDate = useCallback(
    point => rekeyDateCache[point] || Nothing(),
    [rekeyDateCache]
  );

  const syncRekeyDate = useCallback(
    async point => {
      const _web3 = web3.getOrElse(null);
      const _contracts = contracts.getOrElse(null);
      if (!_web3 || !_contracts) {
        return;
      }

      //TODO tighter search?
      //TODO maybe move into azimuth-js?
      const logs = await _contracts.azimuth.getPastEvents('ChangedKeys', {
        fromBlock: 0,
        toBlock: 'latest',
        filter: {
          point: [point],
        },
      });

      if (logs.length === 0) {
        //TODO: better encoding for "no rekeyDate" state?
        addToRekeyDateCache({
          [point]: Just(Result.Error('No rekey date available.')),
        });
      } else {
        // last log is most recent
        const blockNumber = logs[logs.length - 1].blockNumber;
        const block = await _web3.eth.getBlock(blockNumber);
        addToRekeyDateCache({
          [point]: Just(Result.Ok(new Date(block.timestamp * 1000))),
        });
      }
    },
    [web3, contracts, addToRekeyDateCache]
  );

  return {
    getRekeyDate,
    syncRekeyDate,
  };
}
