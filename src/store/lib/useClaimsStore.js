import { useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import { useNetwork } from '../network';
import useSetState from 'lib/useSetState';

const EMPTY_CLAIMS = {
  claims: Nothing(),
};

export default function useClaimsStore() {
  const { contracts } = useNetwork();
  const [claimsCache, addToClaimsCache] = useSetState({});

  const getClaims = useCallback(point => claimsCache[point] || EMPTY_CLAIMS, [
    claimsCache,
  ]);

  const syncClaims = useCallback(
    async point => {
      const _contracts = contracts.getOrElse(null);
      if (!_contracts) {
        return;
      }

      const allClaims = await azimuth.claims.getAllClaims(_contracts, point);

      addToClaimsCache({
        [point]: {
          claims: Just(allClaims),
        },
      });
    },
    [contracts, addToClaimsCache]
  );

  return { getClaims, syncClaims };
}
