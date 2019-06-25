import { useCallback, useState } from 'react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';

export default function useEclipticOwnerStore() {
  const { contracts } = useNetwork();
  const [eclipticOwner, _setEclipticOwner] = useState(null);

  const syncEclipticOwner = useCallback(async () => {
    // owner is generally immutable
    if (eclipticOwner) {
      return;
    }

    const _contracts = contracts.getOrElse(null);
    if (!_contracts) {
      return;
    }

    const owner = await azimuth.ecliptic.owner(_contracts);
    _setEclipticOwner(owner);
  }, [contracts, eclipticOwner]);

  return { eclipticOwner, syncEclipticOwner };
}
