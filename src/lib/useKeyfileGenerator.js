import { useCallback, useEffect, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
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

export default function useKeyfileGenerator(point, manualNetworkSeed) {
  const { getDetails } = usePointCache();
  const { urbitWallet, wallet, authMnemonic } = useWallet();

  const [downloaded, setDownloaded] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [keyfile, setKeyfile] = useState(false);

  const _address = need.wallet(wallet).address;
  const _details = need.details(getDetails(point));

  const networkRevision = parseInt(_details.keyRevisionNumber, 10);
  const { isOwner, isManagementProxy } = usePermissionsForPoint(
    _address,
    point
  );

  const hasNetworkingKeys = networkRevision > 0;
  const available =
    (isOwner || isManagementProxy) && hasNetworkingKeys && keyfile;

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
      console.log('nondeterministic seed!');
      // TODO: tell user their seed is nondeterministic
      return;
    }

    const _networkSeed = networkSeed.value;

    const pair = deriveNetworkKeys(_networkSeed);

    if (!keysMatchChain(pair, _details)) {
      setGenerating(false);
      console.log('Derived networking keys do not match public keys on chain.');
      // TODO: tell usrs their seed is nondeterministic
    }

    setKeyfile(compileNetworkingKey(pair, point, networkRevision));
    setGenerating(false);
  }, [
    manualNetworkSeed,
    urbitWallet,
    wallet,
    authMnemonic,
    _details,
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
    setDownloaded(true);
  }, [keyfile, point, networkRevision]);

  useEffect(() => {
    generate();
  }, [generate]);

  return {
    generating,
    available,
    downloaded,
    download,
  };
}
