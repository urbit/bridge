import { useCallback, useEffect, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import saveAs from 'file-saver';
import * as ob from 'urbit-ob';

import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';

import {
  attemptNetworkSeedDerivation,
  keysMatchChain,
  deriveNetworkKeys,
  compileNetworkingKey,
} from './keys';
import useCurrentPermissions from './useCurrentPermissions';

export default function useKeyfileGenerator(manualNetworkSeed) {
  const { getDetails } = usePointCache();
  const { urbitWallet, wallet, authMnemonic } = useWallet();
  const { pointCursor } = usePointCursor();

  const [downloaded, setDownloaded] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [keyfile, setKeyfile] = useState(false);

  const _point = need.point(pointCursor);
  const _details = need.details(getDetails(_point));

  const networkRevision = parseInt(_details.keyRevisionNumber, 10);
  const { isOwner, isManagementProxy } = useCurrentPermissions();

  const hasNetworkingKeys = networkRevision > 0;
  const available =
    (isOwner || isManagementProxy) && hasNetworkingKeys && !!keyfile;

  console.log(
    `keyfile available (${available}) for revision ${networkRevision}`
  );

  const generate = useCallback(async () => {
    console.log('generating for network revision', networkRevision);

    const networkSeed = manualNetworkSeed
      ? Just(manualNetworkSeed)
      : await attemptNetworkSeedDerivation({
          urbitWallet,
          wallet,
          authMnemonic,
          details: _details,
          revision: networkRevision,
        });

    if (Nothing.hasInstance(networkSeed)) {
      setGenerating(false);
      console.log('manual network seed not provided and key not derivable');
      return;
    }

    const _networkSeed = networkSeed.value;

    const pair = deriveNetworkKeys(_networkSeed);

    if (!keysMatchChain(pair, _details)) {
      setGenerating(false);
      console.log('derived network keys do not match on-chain details');
      return;
    }

    setKeyfile(compileNetworkingKey(pair, _point, networkRevision));
    setGenerating(false);
  }, [
    networkRevision,
    manualNetworkSeed,
    urbitWallet,
    wallet,
    authMnemonic,
    _details,
    _point,
  ]);

  const download = useCallback(() => {
    saveAs(
      new Blob([keyfile], {
        type: 'text/plain;charset=utf-8',
      }),
      `${ob.patp(_point).slice(1)}-${networkRevision}.key`
      // TODO: ^ unifiy "remove tilde" calls
    );
    setDownloaded(true);
  }, [_point, keyfile, networkRevision]);

  useEffect(() => {
    generate();
  }, [generate]);

  const values = {
    generating,
    available,
    downloaded,
    download,
  };

  return { ...values, bind: values };
}
