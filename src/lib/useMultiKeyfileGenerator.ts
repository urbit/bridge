import saveAs from 'file-saver';
import ob from 'urbit-ob';
import { Nothing } from 'folktale/maybe';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { deriveNetworkKeys } from 'urbit-key-generation';
import {
  compileMultiKey,
  deriveNetworkSeedFromUrbitWallet,
  keysMatchChain,
} from './keys';
import { generateCode } from './networkCode';
import { stripSigPrefix } from 'form/formatters';
import useRoller from './useRoller';
import Point from './types/Point';

interface useMultiKeyfileGeneratorArgs {
  point: number;
  inviteWallet: UrbitWallet;
  inviteMasterTicketWallet: UrbitWallet;
}

/**
 * defaults:
 * - point: the activating point
 * - inviteWallet: determinstic invite wallet (generated during invite creation)
 * - inviteMasterTicketWallet: the non-deterministic wallet (generated during invite acceptance);
 *   it is the wallet that receives the point transfer during Activation (and accessed by Master Ticket)
 *
 *   This should only be used during the Activation flow,
 *   because the point will be "in between" key revisions.
 *   (0 --> 1 is when the invite is generated, 1 --> 2 is upon invite acceptance).
 *
 *   For other keyfile use cases, see: useKeyfileGenerator
 */
export default function useMultiKeyfileGenerator({
  point,
  inviteWallet,
  inviteMasterTicketWallet,
}: useMultiKeyfileGeneratorArgs) {
  const [notice, setNotice] = useState('Deriving networking keys...');
  const [downloaded, setDownloaded] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [keyfile, setKeyfile] = useState<boolean | string>(false);
  const [code, setCode] = useState(false);
  const [pointDetails, setPointDetails] = useState<Point | null>(null);
  const { initPoint } = useRoller();

  const fetchPoint = useCallback(async () => {
    setPointDetails(await initPoint(point));
  }, [initPoint, point]);

  useEffect(() => {
    fetchPoint();
  }, [fetchPoint]);

  const currentRevision = useMemo(
    () => (pointDetails ? pointDetails.keyRevisionNumber : 0),
    [pointDetails]
  );
  const nextRevision = useMemo(() => currentRevision + 1, [currentRevision]);

  const pairFromRevision = useCallback(
    async (revision: number, derivationWallet) => {
      if (!pointDetails) {
        return;
      }

      const networkSeed = await deriveNetworkSeedFromUrbitWallet({
        urbitWallet: derivationWallet,
        revision,
      });

      if (Nothing.hasInstance(networkSeed)) {
        setGenerating(false);
        setNotice(
          'Custom or nondeterministic networking keys cannot be re-downloaded.'
        );
        console.log(`seed is nondeterminable for revision ${revision}`);
        return;
      }

      const _networkSeed = networkSeed.value;

      return deriveNetworkKeys(_networkSeed);
    },
    [pointDetails]
  );

  const hasNetworkKeys = currentRevision > 0;

  const generate = useCallback(async () => {
    if (!hasNetworkKeys) {
      setGenerating(false);
      setNotice('Network keys not yet set.');
      console.log(
        `no networking keys available for revision ${currentRevision}`
      );
      return;
    }

    const currentPair = await pairFromRevision(currentRevision, inviteWallet);

    if (!currentPair || !keysMatchChain(currentPair, pointDetails || {})) {
      setGenerating(false);
      setNotice('Derived networking keys do not match on-chain details.');
      console.log(`keys do not match details for revision ${currentRevision}`);
      return;
    }

    // During the activation flow, we pass in the
    // inviteMasterTicketWallet to derive the multikey
    // During the activation flow, we want to use the invite wallet for the next pair
    const nextPair = await pairFromRevision(
      nextRevision,
      inviteMasterTicketWallet
    );

    setNotice('');
    setCode(generateCode(currentPair));
    setKeyfile(
      compileMultiKey(point, [
        {
          revision: currentRevision,
          pair: currentPair,
        },
        {
          revision: nextRevision,
          pair: nextPair,
        },
      ])
    );
    setGenerating(false);
  }, [
    hasNetworkKeys,
    pairFromRevision,
    currentRevision,
    inviteWallet,
    pointDetails,
    nextRevision,
    inviteMasterTicketWallet,
    point,
  ]);

  const filename = useMemo(() => {
    return `${stripSigPrefix(
      ob.patp(point)
    )}-${currentRevision}-${nextRevision}.key`;
  }, [point, currentRevision, nextRevision]);

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

  const output = {
    generating,
    downloaded,
    download,
    filename,
    notice,
    keyfile,
    code,
  };

  return { ...output, bind: output };
}
