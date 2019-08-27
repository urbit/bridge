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
import convertToInt from './convertToInt';

export default function useKeyfileGenerator(manualNetworkSeed) {
  const { urbitWallet, wallet, authMnemonic } = useWallet();
  const { pointCursor } = usePointCursor();
  const { getDetails } = usePointCache();

  const [notice, setNotice] = useState('Deriving networking keys...');
  const [downloaded, setDownloaded] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [keyfile, setKeyfile] = useState(false);

  const _point = need.point(pointCursor);
  const _details = need.details(getDetails(_point));

  const networkRevision = convertToInt(_details.keyRevisionNumber, 10);
  const { isOwner, isManagementProxy } = useCurrentPermissions();

  const hasNetworkingKeys = networkRevision > 0;
  const available =
    (isOwner || isManagementProxy) && hasNetworkingKeys && !!keyfile;

  const generate = useCallback(async () => {
    if (!hasNetworkingKeys) {
      setGenerating(false);
      setNotice('Networking keys not yet set.');
      console.log(
        `no networking keys available for revision ${networkRevision}`
      );
      return;
    }

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
      setNotice(
        'Custom or nondeterministic networking keys cannot be re-downloaded.'
      );
      console.log(`seed is nondeterminable for revision ${networkRevision}`);
      return;
    }

    const _networkSeed = networkSeed.value;

    const pair = deriveNetworkKeys(_networkSeed);

    if (!keysMatchChain(pair, _details)) {
      setGenerating(false);
      setNotice('Derived networking keys do not match on-chain details.');
      console.log(`keys do not match details for revision ${networkRevision}`);
      return;
    }

    setNotice();
    setKeyfile(compileNetworkingKey(pair, _point, networkRevision));
    setGenerating(false);
  }, [
    networkRevision,
    hasNetworkingKeys,
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
    notice,
  };

  return { ...values, bind: values };
}
