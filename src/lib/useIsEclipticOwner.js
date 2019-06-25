import { useWallet } from 'store/wallet';
import { usePointCache } from 'store/pointCache';

import { eqAddr } from 'lib/wallet';

export default function useIsEclipticOwner() {
  const { wallet } = useWallet();
  const { eclipticOwner } = usePointCache();

  return wallet.matchWith({
    Nothing: () => false,
    Just: p => {
      if (!eclipticOwner) {
        return false;
      }

      return eqAddr(p.value.address, eclipticOwner);
    },
  });
}
