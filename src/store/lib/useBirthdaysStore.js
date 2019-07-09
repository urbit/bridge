import { useCallback, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { useNetwork } from '../network';

export default function useBirthdayStore() {
  const { contracts, web3 } = useNetwork();
  const [birthdayCache, _setBirthdayCache] = useState({});

  const addToBirthdayCache = useCallback(
    entry =>
      _setBirthdayCache(cache => ({
        ...cache,
        ...entry,
      })),
    [_setBirthdayCache]
  );

  const getBirthday = useCallback(point => birthdayCache[point] || Nothing(), [
    birthdayCache,
  ]);

  const syncBirthday = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      if (!_contracts || !_web3) {
        return;
      }

      // birthday will not change after being set, so bail if we already know
      if (Just.hasInstance(getBirthday(point))) {
        return;
      }

      const birthBlock = await azimuth.azimuth.getActivationBlock(
        _contracts,
        point
      );

      if (birthBlock > 0) {
        const block = await _web3.eth.getBlock(birthBlock);
        addToBirthdayCache({
          [point]: Just(new Date(block.timestamp * 1000)),
        });
      } else {
        // TODO: better encoding for "no birthday" state?
        // if there's no birthday, just use today
        addToBirthdayCache({
          [point]: Just(new Date()),
        });
      }
    },
    [contracts, web3, addToBirthdayCache, getBirthday]
  );

  return { getBirthday, syncBirthday };
}
