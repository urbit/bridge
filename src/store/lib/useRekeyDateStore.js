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

      // NB(shrugs) using try-catch here to simplify our error handling
      try {
        if (logs.length === 0) {
          throw new Error('No logs available.');
        }

        // last log is most recent
        const blockNumber = logs[logs.length - 1].blockNumber;
        if (blockNumber === null) {
          // the "latest" parameter includes pending blocks,
          // which won't have a blockNumber just yet
          throw new Error('Latest rekey is still pending');
        }

        const block = await _web3.eth.getBlock(blockNumber);
        addToRekeyDateCache({
          [point]: Just(Result.Ok(new Date(block.timestamp * 1000))),
        });
      } catch {
        //TODO: better encoding for "no rekeyDate" state?
        addToRekeyDateCache({
          [point]: Just(Result.Error('No rekey date available.')),
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
