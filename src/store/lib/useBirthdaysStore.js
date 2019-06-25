import { useCallback, useState } from 'react';
import Maybe from 'folktale/maybe';
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

  const getBirthday = useCallback(
    point => birthdayCache[point] || Maybe.Nothing(),
    [birthdayCache]
  );

  const syncBirthday = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      if (!_contracts || !web3) {
        return;
      }

      // fetch birthday if not already known—will not change after being set
      if (Maybe.Nothing.hasInstance(getBirthday(point))) {
        const birthBlock = await azimuth.azimuth.getActivationBlock(
          _contracts,
          point
        );

        if (birthBlock > 0) {
          const block = await _web3.eth.getBlock(birthBlock);
          addToBirthdayCache({
            [point]: Maybe.Just(new Date(block.timestamp * 1000)),
          });
        }
      }
    },
    [contracts, web3, addToBirthdayCache, getBirthday]
  );

  return { getBirthday, syncBirthday };
}
