import { useCallback, useMemo, useEffect, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import saveAs from 'file-saver';

import { useWallet } from 'store/wallet';
import { useRollerStore } from 'store/rollerStore';

import { generateCode } from 'lib/networkCode';

import {
  attemptNetworkSeedDerivation,
  keysMatchChain,
  deriveNetworkKeys,
  compileMultiKey,
} from './keys';
import { stripSigPrefix } from 'form/formatters';

interface useKeyfileGeneratorArgs {
  seed?: string;
}

/**
 * seed - (optional) derived from wallet, mnemonic, or token by default (if possible)
 */
export default function useKeyfileGenerator({ seed }: useKeyfileGeneratorArgs) {
  const { urbitWallet, wallet, authMnemonic, authToken }: any = useWallet();
  const { point } = useRollerStore();

  const [notice, setNotice] = useState('Deriving networking keys...');
  const [downloaded, setDownloaded] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [keyfile, setKeyfile] = useState<boolean | string>(false);
  const [code, setCode] = useState(false);

  const networkRevision = Number(point.keyRevisionNumber);
  const canManage = point.isOwner || point.isManagementProxy;

  const hasNetworkKeys = networkRevision > 0;
  const available = canManage && hasNetworkKeys && !!keyfile;

  const generate = useCallback(async () => {
    if (!hasNetworkKeys) {
      setGenerating(false);
      setNotice('Network keys not yet set.');
      console.log(
        `no networking keys available for revision ${networkRevision}`
      );
      return;
    }

    const networkSeed = seed
      ? Just(seed)
      : await attemptNetworkSeedDerivation({
          urbitWallet,
          wallet,
          authMnemonic,
          details: point,
          authToken,
          point: point.value,
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

    if (!keysMatchChain(pair, point)) {
      setGenerating(false);
      setNotice('Derived networking keys do not match on-chain details.');
      console.log(`keys do not match details for revision ${networkRevision}`);
      return;
    }

    setNotice('');
    setCode(generateCode(pair));
    setKeyfile(
      compileMultiKey(point.value, [
        {
          revision: networkRevision,
          pair: pair,
        },
      ])
    );
    setGenerating(false);
  }, [
    networkRevision,
    hasNetworkKeys,
    seed,
    urbitWallet,
    wallet,
    authMnemonic,
    setCode,
    point,
    authToken,
  ]);

  const filename = useMemo(() => {
    return `${stripSigPrefix(point.patp)}-${networkRevision}.key`;
  }, [point, networkRevision]);

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
