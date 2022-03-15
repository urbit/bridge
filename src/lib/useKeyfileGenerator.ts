import { useCallback, useMemo, useEffect, useState } from 'react';
import { Just } from 'folktale/maybe';
import saveAs from 'file-saver';
import { useWallet } from 'store/wallet';
import { EMPTY_POINT, useRollerStore } from 'store/rollerStore';
import { generateCode } from 'lib/networkCode';
import {
  attemptNetworkSeedDerivation,
  deriveNetworkSeedFromUrbitWallet,
  keysMatchChain,
  deriveNetworkKeys,
  compileMultiKey,
  deriveNetworkSeedFromAuthToken,
} from './keys';
import { stripSigPrefix } from 'form/formatters';
import useRoller from './useRoller';
import Point from './types/Point';
import { toL1Details } from './utils/point';
import { ETH_ZERO_ADDR } from './constants';
import { getSha256AuthToken } from './authToken';

interface useKeyfileGeneratorArgs {
  point?: Point;
  seeds: string[];
}

/**
 * The default Keyfile Generator. Can be used by itself, or composed with
 * other hooks (see `useActivationKeyfileGenerator` and
 * `useSingleKeyfileGenerator`).
 *
 * @param point Point - (optional) the Point for which to generate keys
 * @param seeds string[] - (required) one or more seeds consumed by deriveNetworkKeys
 *
 */
function useKeyfileGenerator({ point, seeds }: useKeyfileGeneratorArgs) {
  // exported keyfile generator properties
  const [notice, setNotice] = useState('Deriving networking keys...');
  const [downloaded, setDownloaded] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [keyfile, setKeyfile] = useState<boolean | string>(false);
  const [code, setCode] = useState(false);

  // resolved point
  const { point: storedPoint } = useRollerStore();
  const resolvedPoint = useMemo(() => {
    return point || storedPoint;
  }, [point, storedPoint]);

  const networkRevision = useMemo(() => {
    return Number(resolvedPoint.keyRevisionNumber);
  }, [resolvedPoint]);
  const canManage = useMemo(() => {
    return resolvedPoint.isOwner || resolvedPoint.isManagementProxy;
  }, [resolvedPoint]);

  const hasNetworkKeys = networkRevision > 0;
  const available = canManage && hasNetworkKeys && !!keyfile;

  const generate = useCallback(async () => {
    // Point still loading ...
    if (resolvedPoint.value === EMPTY_POINT.value) {
      return;
    }

    if (!hasNetworkKeys) {
      setGenerating(false);
      setNotice('Network keys not yet set.');
      console.log(
        `no networking keys available for revision ${networkRevision}`
      );
      return;
    }

    // seeds were either generated non-deterministically,
    // or still being derived ...
    if (seeds.length === 0) {
      setGenerating(false);
      setNotice(
        'Custom or nondeterministic networking keys cannot be re-downloaded.'
      );
      console.log(`seed is nondeterminable for revision ${networkRevision}`);
      return;
    }

    const pairs = seeds.map(seed => deriveNetworkKeys(seed));
    const firstPair = pairs[0];

    if (!keysMatchChain(firstPair, resolvedPoint)) {
      setGenerating(false);
      setNotice('Derived networking keys do not match on-chain details.');
      console.log(`keys do not match details for revision ${networkRevision}`);
      return;
    }

    setNotice('');
    setCode(generateCode(firstPair));
    setKeyfile(
      compileMultiKey(
        resolvedPoint.value,
        pairs.map((pair, k) => {
          return { revision: networkRevision + k, pair };
        })
      )
    );
    setGenerating(false);
  }, [hasNetworkKeys, seeds, resolvedPoint, networkRevision]);

  const filename = useMemo(() => {
    return `${stripSigPrefix(resolvedPoint.patp)}-${networkRevision}.key`;
  }, [resolvedPoint, networkRevision]);

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

interface ActivationKeyfileGeneratorArgs {
  pointId: number;
  wallets: UrbitWallet[];
}

/**
 * This Activation Keyfile Generator is used to derive a multikey during the
 * Activation Flow. At the time of generation, there is no Point yet set in
 * the Roller Store, so we need to look it up by Point ID (to retreive the
 * current key revision via API).
 *
 * @param pointId number - (required) the point ID for which to generate keys
 * @param wallets UrbitWallet[] - (required) for each wallet,
 *   a seed + revision pair is generated and consumed by `compileMultiKey`.
 *   It should be an array of [deterministic invite wallet, non-deterministic
 *   master ticket wallet] (the sending and receiving wallets)
 */
export const useActivationKeyfileGenerator = ({
  pointId,
  wallets,
}: ActivationKeyfileGeneratorArgs) => {
  // resolve point
  const { api } = useRoller();
  const [point, setPoint] = useState<Point>(EMPTY_POINT);

  const resolvePoint = useCallback(async () => {
    const resolved = new Point({
      value: pointId,
      details: toL1Details(await api.getPoint(pointId)),
      address: ETH_ZERO_ADDR,
    });

    setPoint(resolved);
  }, [api, pointId]);

  useEffect(() => {
    resolvePoint();
  }, [resolvePoint]);

  // derive seeds from wallets
  const [seeds, setSeeds] = useState<string[]>([]);
  const deriveSeeds = useCallback(async () => {
    if (!('keyRevisionNumber' in point)) {
      return;
    }

    const derivedSeeds = await Promise.all(
      wallets.map(async (w, i) => {
        return deriveNetworkSeedFromUrbitWallet(w, point.keyRevisionNumber + i);
      })
    );

    setSeeds(
      derivedSeeds
        .map(maybeSeed => maybeSeed.getOrElse(null))
        .filter(s => s !== null)
    );
  }, [point, wallets]);

  useEffect(() => {
    deriveSeeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point]);

  return useKeyfileGenerator({ point, seeds });
};

interface SingleKeyfileGeneratorArgs {
  seed?: string;
}

/**
 * This Single Keyfile Generator is used to derive network keys in multiple
 * views in the Bridge dashboard (Set Network Keys, Home > ID, Home > OS).
 * By default, it uses the logged in wallet's seed phrase.
 *
 * * @param seed string - (optional) default: provided by the logged in wallet
 */
export const useSingleKeyfileGenerator = ({
  seed,
}: SingleKeyfileGeneratorArgs) => {
  const { point } = useRollerStore();

  const { authMnemonic, authToken, urbitWallet, wallet }: any = useWallet();
  const [defaultSeeds, setDefaultSeeds] = useState<string[]>([]);
  const [fallbackSeeds, setFallbackSeeds] = useState<string[]>([]);

  const deriveSeeds = useCallback(async () => {
    // When the user enters a manual non-determinstic seed
    if (seed) {
      setDefaultSeeds([seed]);
      return;
    }

    // First check if we can re-derive with the existing auth token.
    const defaultDerivedSeed = await attemptNetworkSeedDerivation({
      urbitWallet,
      wallet,
      authMnemonic,
      details: point,
      authToken,
      point: point.value,
      revision: point.keyRevisionNumber,
    });

    if (Just.hasInstance(defaultDerivedSeed)) {
      setDefaultSeeds([defaultDerivedSeed.value]);
    }

    /**
     * Otherwise, we will need to try a different token derivation scheme.
     *
     * Due to a logical error with auth token derivation, keys set between May
     * 2021 and March 2022 used `sha256` instead of the logically correct
     * `keccak256`. To mitigate this for users who log back into Bridge to
     * download their keyfile or copy their access code, we need to check for
     * the existence by deriving with a fallback algorithm.
     *
     * See this issue for additional context:
     * https://github.com/urbit/bridge/issues/549
     */

    const fallbackAuthToken = getSha256AuthToken({ wallet: wallet.value });
    const fallbackDerivedSeed = deriveNetworkSeedFromAuthToken(
      point.value,
      fallbackAuthToken,
      point.keyRevisionNumber
    );

    if (Just.hasInstance(fallbackDerivedSeed)) {
      setFallbackSeeds([fallbackDerivedSeed.value]);
    }
  }, [authMnemonic, authToken, point, seed, urbitWallet, wallet]);

  useEffect(() => {
    deriveSeeds();
  }, [deriveSeeds]);

  const defaultBind = useKeyfileGenerator({ seeds: defaultSeeds });
  const fallbackBind = useKeyfileGenerator({ seeds: fallbackSeeds });

  const output = useMemo(() => {
    return fallbackBind.keyfile
      ? {
          ...fallbackBind,
        }
      : {
          ...defaultBind,
        };
  }, [defaultBind, fallbackBind]);

  return output;
};
