import useEthereumTransaction from 'lib/useEthereumTransaction';
import { useCallback } from 'react';
import { useNetwork } from 'store/network';
import * as need from 'lib/need';
import { conditionalSR, linearSR } from 'azimuth-js';

export function useTransferLockup(kind) {
  const { contracts } = useNetwork();

  return useEthereumTransaction(
    useCallback(
      to => {
        const _contracts = need.contracts(contracts);
        if (kind === 'conditional') {
          return conditionalSR.approveCommitmentTransfer(_contracts, to);
        } else {
          return linearSR.approveBatchTransfer(_contracts, to);
        }
      },
      [kind, contracts]
    ),
    () => {}
  );
}
