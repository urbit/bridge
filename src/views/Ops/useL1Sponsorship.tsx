import { ecliptic } from 'azimuth-js';
import * as need from 'lib/need';
import { GAS_LIMITS } from 'lib/constants';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { useCallback } from 'react';
import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { useRollerStore } from 'store/rollerStore';
import { Ship } from '@urbit/roller-api';

export function useL1Sponsorship() {
  const { contracts }: any = useNetwork();
  const _contracts = need.contracts(contracts);
  const { point } = useRollerStore();
  const { syncResidents }: any = usePointCache();

  return useEthereumTransaction(
    useCallback(
      (adoptee: Ship, denied: boolean) =>
        denied
          ? ecliptic.reject(_contracts, adoptee)
          : ecliptic.adopt(_contracts, adoptee),
      [_contracts]
    ),
    useCallback(() => syncResidents(point.value), [syncResidents, point]),
    GAS_LIMITS.DEFAULT
  );
}
