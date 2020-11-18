import { useCallback, useState } from 'react';
import * as azimuth from 'azimuth-js';
import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import convertToInt from './convertToInt';

export default function useMakeClaim() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();

  const _contracts = need.contracts(contracts);
  const _point = convertToInt(need.point(pointCursor), 10);

  const [claimData, setClaimData] = useState();
  const { syncClaims } = usePointCache();

  return useEthereumTransaction(
    useCallback(
      (protocol, claim, dossier) => {
        setClaimData({ protocol, claim, dossier });
        return azimuth.claims.addClaim(
          _contracts,
          _point,
          protocol,
          claim,
          dossier
        );
      },
      [_contracts, _point]
    ),
    useCallback(() => syncClaims(_point), [syncClaims, _point]),
    GAS_LIMITS.DEFAULT
  );
}
