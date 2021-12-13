import useEthereumTransaction from 'lib/useEthereumTransaction';
import { useCallback } from 'react';
import { usePointCache } from 'store/pointCache';
import { useStarReleaseCache } from 'store/starRelease';

export function useWithdrawStars() {
  const { syncControlledPoints } = usePointCache();

  const { syncStarReleaseDetails, withdraw } = useStarReleaseCache();
  return useEthereumTransaction(
    useCallback((to, amount) => withdraw(amount, to), [withdraw]),
    useCallback(
      () => Promise.all([syncControlledPoints(), syncStarReleaseDetails()]),
      [syncStarReleaseDetails, syncControlledPoints]
    )
  );
}
