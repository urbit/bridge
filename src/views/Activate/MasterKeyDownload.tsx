import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as need from 'lib/need';
import * as ob from 'urbit-ob';

import { ActivateSteps } from './ActivateSteps';
import { Box } from '@tlon/indigo-react';
import { FadeableActivateButton as ActivateButton } from './ActivateButton';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { FadeableActivateParagraph as ActivateParagraph } from './ActivateParagraph';
import { FadeableDangerBox as DangerBox } from './DangerBox';
import { FadeableMasterKeyCopy as MasterKeyCopy } from './MasterKeyCopy';
import { FadeableMasterKeyPresenter as MasterKeyPresenter } from './MasterKeyPresenter';
import { useActivateFlow } from './ActivateFlow';
import ActivateView from './ActivateView';
import { useLocalRouter } from 'lib/LocalRouter';
import { compileNetworkingKey } from 'lib/keys';
import { downloadWallet } from 'lib/invite';
import PaperBuilder from 'components/PaperBuilder';
import { DEFAULT_FADE_TIMEOUT } from 'lib/constants';
import { timeout } from 'lib/timeout';

const MasterKeyDownload = () => {
  const {
    derivedPoint,
    derivedWallet,
    generated,
    setGenerated,
    setIsIn,
  } = useActivateFlow();
  const { push, names } = useLocalRouter();
  const point = need.point(derivedPoint);
  const wallet = need.wallet(derivedWallet);
  const ticket = wallet.ticket;

  const [paper, setPaper] = useState(Nothing());
  const [triggerAnimation, setTriggerAnimation] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  const pointAsString = derivedPoint.matchWith({
    Nothing: () => '',
    Just: p => p.value.toFixed(),
  });

  const download = useCallback(() => {
    const netkey = compileNetworkingKey(wallet.network.keys, point, 1);
    //TODO  could be deduplicated with useKeyfileGenerator's logic
    const filename = ob.patp(point).slice(1) + '-1.key';
    downloadWallet(paper.getOrElse([]), netkey, filename);
    setDownloaded(true);
  }, [paper, wallet, point, setDownloaded]);

  // sync paper value to activation state
  useEffect(
    () =>
      setGenerated(
        paper.matchWith({
          Nothing: () => false,
          Just: () => true,
        })
      ),
    [paper, setGenerated]
  );

  const goToConfirm = useCallback(async () => {
    setIsIn(false);
    await timeout(DEFAULT_FADE_TIMEOUT); // Pause for UI fade animation
    push(names.CONFIRM);
  }, [setIsIn, push, names.CONFIRM]);

  const header = useMemo(() => {
    return triggerAnimation ? (
      <Box>
        <ActivateHeader copy={'Backup your Master Key.'} />
        <ActivateParagraph
          copy={
            'Download your backup and store it somewhere safe, e.g. your security deposit box or password manager.'
          }
        />
      </Box>
    ) : null;
  }, [triggerAnimation]);

  const footer = useMemo(() => {
    return triggerAnimation ? (
      <ActivateButton
        disabled={!generated}
        onClick={!downloaded ? download : goToConfirm}
        success={downloaded}>
        {!downloaded ? 'Download Backup (Passport)' : 'Continue'}
      </ActivateButton>
    ) : null;
  }, [download, downloaded, generated, goToConfirm, triggerAnimation]);

  const delayedReveal = useCallback(async () => {
    setTimeout(() => {
      setTriggerAnimation(true);
      setIsIn(true);
    }, 800);
  }, [setIsIn]);

  useEffect(() => {
    delayedReveal();

    return () => {
      setIsIn(false);
    };
  }, [delayedReveal, setIsIn]);

  return (
    <>
      <ActivateView header={header} footer={footer}>
        <Box
          alignItems={'center'}
          display={'flex'}
          flexDirection={'column'}
          flexWrap={'nowrap'}
          height={'100%'}
          justifyContent={'space-evenly'}>
          {triggerAnimation && (
            <DangerBox>Do not share this with anyone else!</DangerBox>
          )}
          {ticket && (
            <MasterKeyPresenter overrideFadeIn={true} ticket={ticket} />
          )}
          {triggerAnimation && <MasterKeyCopy text={ticket} />}
        </Box>
      </ActivateView>
      <ActivateSteps currentStep={1} totalSteps={4} />
      <PaperBuilder
        point={pointAsString}
        wallets={[wallet]}
        callback={data => {
          setPaper(Just(data));
        }}
      />
    </>
  );
};

export default MasterKeyDownload;
