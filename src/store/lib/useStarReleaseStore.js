import { useState, useCallback } from 'react';
import { Nothing, Just } from 'folktale/maybe';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import {
  generateWithdrawTxs,
  getLinear,
  getConditional,
  getLockupKind,
} from 'lib/starRelease';

export default function useStarRelease() {
  const { contracts } = useNetwork();
  const { wallet } = useWallet();

  const [starReleaseDetails, _setDetails] = useState(Nothing());

  const [batchLimits, setBatchLimits] = useState([]);

  const syncStarReleaseDetails = useCallback(async () => {
    const _wallet = wallet.getOrElse(null);
    const _contracts = contracts.getOrElse(null);
    if (!(_contracts && _wallet)) {
      return;
    }
    _setDetails(Nothing());

    const address = _wallet.address;

    try {
      console.log('start');

      const linear = await getLinear(_contracts, address);
      console.log('1');

      // const conditional = await getConditional(_contracts, address);
      const conditional = { approvedTransferTo: '0x000' };
      console.log('2');

      const kind = await getLockupKind(_contracts, address);
      console.log('3');

      // const [linear, conditional, kind] = await Promise.all([
      //   getLinear(_contracts, address),
      //   getConditional(_contracts, address),
      //   getLockupKind(_contracts, address),
      // ]);

      console.log('done querying');

      const keys = Object.keys(linear);
      const result = keys.reduce(
        (acc, key) => ({ ...acc, [key]: linear[key] + conditional[key] }),
        {}
      );
      result.kind = kind;
      result.linear = { approvedTransferTo: linear.approvedTransferTo };
      result.conditional = {
        approvedTransferTo: conditional.approvedTransferTo,
      };
      setBatchLimits(conditional.batchLimits);

      _setDetails(Just(result));
      console.log('done');
    } catch (e) {
      _setDetails(Just(null));
      console.error('error fetching star release details', e);
    }
  }, [contracts, wallet]);

  const withdraw = useCallback(
    (amount, to) => {
      const _wallet = wallet.getOrElse(null);
      const _contracts = contracts.getOrElse(null);
      if (!(_contracts && _wallet)) {
        return [];
      }
      return generateWithdrawTxs(_contracts, batchLimits, amount, to);
    },
    [batchLimits, contracts, wallet]
  );

  return { starReleaseDetails, syncStarReleaseDetails, withdraw };
}
