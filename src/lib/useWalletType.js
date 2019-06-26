import { useEffect } from 'react';

import { useWallet } from 'store/wallet';

export default function useWalletType(walletType) {
  const { setWalletType } = useWallet();

  useEffect(() => {
    setWalletType(walletType);
  }, [setWalletType, walletType]);
}
