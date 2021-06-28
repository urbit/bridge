import { useWallet } from 'store/wallet';
import { usePointCache } from 'store/pointCache';

import { eqAddr } from 'lib/utils/crypto';
import useLifecycle from './useLifecycle';

export default function useIsEclipticOwner() {
  const { wallet } = useWallet();
  const { eclipticOwner, syncEclipticOwner } = usePointCache();

  useLifecycle(() => {
    syncEclipticOwner();
  });

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
