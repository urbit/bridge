import { useCallback, useRef } from 'react';
import { Just } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import { randomHex } from 'web3-utils';

import { usePointCache } from 'store/pointCache';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { useRollerStore } from 'store/rollerStore';

import * as need from 'lib/need';
import {
  attemptNetworkSeedDerivation,
  deriveNetworkKeys,
  CRYPTO_SUITE_VERSION,
} from 'lib/keys';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { addHexPrefix } from 'lib/utils/address';
import { useSingleKeyfileGenerator } from 'lib/useKeyfileGenerator';

export function useSetNetworkKeys(
  manualNetworkSeed: string,
  setManualNetworkSeed: (seed: string) => void
) {
  const { urbitWallet, wallet, authMnemonic, authToken }: any = useWallet();
  const { point } = useRollerStore();
  const { syncDetails, syncRekeyDate }: any = usePointCache();
  const { contracts }: any = useNetwork();

  const _contracts = need.contracts(contracts);

  const networkRevision = Number(point.keyRevisionNumber);
  const randomSeed = useRef<string | null>();

  const {
    generating: keyfileGenerating,
    filename,
    bind: keyfileBind,
  } = useSingleKeyfileGenerator({ seed: manualNetworkSeed });

  const buildNetworkSeed = useCallback(
    async manualSeed => {
      if (manualSeed !== undefined) {
        setManualNetworkSeed(manualSeed);
        return manualSeed;
      } else {
        const newNetworkRevision = networkRevision + 1;
        console.log(`deriving seed with revision ${newNetworkRevision}`);

        const networkSeed = await attemptNetworkSeedDerivation({
          urbitWallet,
          wallet,
          authMnemonic,
          details: point,
          point: point.value,
          authToken,
          revision: newNetworkRevision,
        });

        if (Just.hasInstance(networkSeed)) {
          return networkSeed.value;
        }

        randomSeed.current = randomSeed.current || randomHex(32); // 32 bytes
        setManualNetworkSeed(randomSeed.current);

        return randomSeed.current;
      }
    },
    [
      authMnemonic,
      setManualNetworkSeed,
      networkRevision,
      urbitWallet,
      wallet,
      point,
      authToken,
    ]
  );

  const { completed: _completed, ...rest } = useEthereumTransaction(
    useCallback(
      async (manualSeed: string, isDiscontinuity: boolean) => {
        const seed = await buildNetworkSeed(manualSeed);
        const pair = deriveNetworkKeys(seed);

        return azimuth.ecliptic.configureKeys(
          _contracts,
          point.value,
          addHexPrefix(pair.crypt.public),
          addHexPrefix(pair.auth.public),
          CRYPTO_SUITE_VERSION,
          isDiscontinuity
        );
      },
      [_contracts, point, buildNetworkSeed]
    ),
    useCallback(
      () => Promise.all([syncDetails(point.value), syncRekeyDate(point.value)]),
      [point, syncDetails, syncRekeyDate]
    ),
    GAS_LIMITS.CONFIGURE_KEYS
  );

  // only treat the transaction as completed once we also have keys to download
  const completed = _completed && !keyfileGenerating;

  return {
    completed,
    filename,
    keyfileBind,
    ...rest,
  };
}
