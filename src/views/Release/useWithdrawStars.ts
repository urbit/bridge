import useEthereumTransaction from 'lib/useEthereumTransaction';
import { useCallback } from 'react';
import { usePointCache } from 'store/pointCache';
import { useStarReleaseCache } from 'store/starRelease';

export function useWithdrawStars() {
  const { syncControlledPoints }: any = usePointCache();

  const { syncStarReleaseDetails, withdraw }: any = useStarReleaseCache();
  return useEthereumTransaction(
    useCallback((to: string, amount: number) => withdraw(amount, to), [
      withdraw,
    ]),
    useCallback(
      () => Promise.all([syncControlledPoints(), syncStarReleaseDetails()]),
      [syncStarReleaseDetails, syncControlledPoints]
    )
  );
}
