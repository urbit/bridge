import { useEffect } from 'react';
import { Nothing } from 'folktale/maybe';

import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

// All the things we want to do when we mount a login view
export default function useLoginView(walletType) {
  const { setWalletType, resetWallet } = useWallet();
  const { setPointCursor } = usePointCursor();

  useEffect(() => {
    resetWallet();
    setWalletType(walletType);
    setPointCursor(Nothing());
  }, [setWalletType, walletType, setPointCursor, resetWallet]);
}
