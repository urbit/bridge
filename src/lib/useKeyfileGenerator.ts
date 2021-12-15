import { useCallback, useMemo, useEffect, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import saveAs from 'file-saver';
import ob from 'urbit-ob';

import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import { generateCode } from 'lib/networkCode';

import {
  attemptNetworkSeedDerivation,
  keysMatchChain,
  deriveNetworkKeys,
  compileNetworkKey,
} from './keys';
import useCurrentPermissions from './useCurrentPermissions';
import { convertToInt } from './convertToInt';
import { stripSigPrefix } from 'form/formatters';

// overrideable defaults:
// seed - derived from wallet, mnemonic, or token (if posisble)
// point - the current pointCursor
interface useKeyfileGeneratorArgs {
  seed?: string;
  point?: number;
}

/**
 * @deprecated
 * Use `useMultikeyFileGenerator` instead
 */
export default function useKeyfileGenerator({
  seed,
  point,
}: useKeyfileGeneratorArgs) {
  const { urbitWallet, wallet, authMnemonic, authToken }: any = useWallet();
  const { pointCursor }: any = usePointCursor();
  const { syncDetails, getDetails }: any = usePointCache();

  const [notice, setNotice] = useState('Deriving networking keys...');
  const [downloaded, setDownloaded] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [keyfile, setKeyfile] = useState<boolean | string>(false);
  const [code, setCode] = useState(false);

  const _point = point || need.point(pointCursor);
  useEffect(() => {
    syncDetails(_point);
  }, [_point, syncDetails]);

  const details = getDetails(_point);

  const networkRevision = details.matchWith({
    Just: ({ value }) => convertToInt(value.keyRevisionNumber, 10),
    Nothing: () => 0,
  });
  const { isOwner, isManagementProxy } = useCurrentPermissions();

  const hasNetworkKeys = networkRevision > 0;
  const available =
    (isOwner || isManagementProxy) && hasNetworkKeys && !!keyfile;

  const generate = useCallback(async () => {
    if (!hasNetworkKeys) {
      setGenerating(false);
      setNotice('Network keys not yet set.');
      console.log(
        `no networking keys available for revision ${networkRevision}`
      );
      return;
    }

    const _details = need.details(details);

    const networkSeed = seed
      ? Just(seed)
      : await attemptNetworkSeedDerivation({
          urbitWallet,
          wallet,
          authMnemonic,
          details: _details,
          authToken,
          point: _point,
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

    setNotice('');
    setCode(generateCode(pair));
    setKeyfile(compileNetworkKey(pair, _point, networkRevision));
    setGenerating(false);
  }, [
    networkRevision,
    hasNetworkKeys,
    seed,
    urbitWallet,
    wallet,
    authMnemonic,
    setCode,
    details,
    _point,
    authToken,
  ]);

  const filename = useMemo(() => {
    return `${stripSigPrefix(ob.patp(_point))}-${networkRevision}.key`;
  }, [_point, networkRevision]);

  const download = useCallback(() => {
    if (typeof keyfile !== 'string') {
      return;
    }

    saveAs(
      new Blob([keyfile], {
        type: 'text/plain;charset=utf-8',
      }),
      filename
    );
    setDownloaded(true);
  }, [filename, keyfile]);

  useEffect(() => {
    generate();
  }, [generate]);

  const values = {
    generating,
    available,
    downloaded,
    download,
    filename,
    notice,
    keyfile,
    code,
  };

  return { ...values, bind: values };
}
