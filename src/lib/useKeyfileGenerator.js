import { useCallback, useState } from 'react';
import saveAs from 'file-saver';
import * as ob from 'urbit-ob';

import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';

import * as need from 'lib/need';

import {
  attemptNetworkSeedDerivation,
  keysMatchChain,
  deriveNetworkKeys,
  compileNetworkingKey,
} from './keys';
import usePermissionsForPoint from './usePermissionsForPoint';

export default function useKeyfileGenerator(point) {
  const { getDetails, getOptimisticDetails } = usePointCache();
  const { urbitWallet, wallet, authMnemonic } = useWallet();

  const [generating, setGenerating] = useState(false);
  const [keyfile, setKeyfile] = useState();

  const details = need.details(getDetails(point));
  const optimisticDetails = getOptimisticDetails(point);

  // use the optimistic key revision number if available
  // (because we may have set networking keys earlier)
  const networkRevision = optimisticDetails.keyRevisionNumber.matchWith({
    Nothing: () => parseInt(details.keyRevisionNumber, 10),
    Just: p => p.value,
  });

  const { isOwner, isManagementProxy } = usePermissionsForPoint(point);
  const hasNetworkingKeys = networkRevision > 0;
  const available = (isOwner || isManagementProxy) && hasNetworkingKeys;

  const generate = useCallback(async () => {
    setGenerating(true);

    const networkSeed = await attemptNetworkSeedDerivation({
      urbitWallet,
      wallet,
      authMnemonic,
      details,
      revision: networkRevision,
    });

    const _networkSeed = need.value(networkSeed, () => {
      setGenerating(false);
      throw new Error('Could not derive networking seed.');
    });

    const pair = deriveNetworkKeys(_networkSeed);

    if (!keysMatchChain(pair, details)) {
      setGenerating(false);
      throw new Error(
        'Derived networking keys do not match public keys on chain.'
      );
    }

    setKeyfile(compileNetworkingKey(pair, point, networkRevision));
    setGenerating(false);
  }, [
    setGenerating,
    setKeyfile,
    urbitWallet,
    wallet,
    authMnemonic,
    details,
    networkRevision,
    point,
  ]);

  const download = useCallback(() => {
    saveAs(
      new Blob([keyfile], {
        type: 'text/plain;charset=utf-8',
      }),
      `${ob.patp(point).slice(1)}-${networkRevision}.key`
      // TODO: ^ unifiy "remove tilde" calls
    );
  }, [point, keyfile, networkRevision]);

  const generateAndDownload = useCallback(async () => {
    await generate();
    download();
  }, [generate, download]);

  return {
    generating,
    available,
    generateAndDownload,
  };
}
