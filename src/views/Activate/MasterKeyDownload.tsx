import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as need from 'lib/need';

import { ActivateSteps } from './ActivateSteps';
import { Box } from '@tlon/indigo-react';
import { FadeableActivateButton as ActivateButton } from './ActivateButton';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { FadeableActivateParagraph as ActivateParagraph } from './ActivateParagraph';
import { FadeableDangerBox as DangerBox } from './DangerBox';
import { FadeableMasterKeyCopy as MasterKeyCopy } from './MasterKeyCopy';
import { FadeableMasterKeyPresenter as MasterKeyPresenter } from './MasterKeyPresenter';
import { useActivateFlow } from './useActivateFlow';
import ActivateView from './ActivateView';
import { useLocalRouter } from 'lib/LocalRouter';
import PaperBuilder from 'components/PaperBuilder';
import { DEFAULT_FADE_TIMEOUT, MASTER_KEY_DURATION } from 'lib/constants';
import { timeout } from 'lib/timeout';
import { downloadWallet } from 'lib/invite';
import View from 'components/View';
import { useActivationKeyfileGenerator } from 'lib/useKeyfileGenerator';

const MasterKeyDownload = () => {
  const {
    derivedPoint,
    inviteMasterTicketWallet,
    inviteWallet,
    isIn,
    setGenerated,
    setIsIn,
  }: any = useActivateFlow();
  const { data, push, names }: any = useLocalRouter();
  const point = need.point(derivedPoint);
  const wallet = need.wallet(inviteMasterTicketWallet);
  const ticket = wallet.ticket.replace('~', '');

  const [paper, setPaper] = useState(Nothing());
  const [triggerAnimation, setTriggerAnimation] = useState<boolean>(false);

  const skipAnimationDelay = useMemo(() => {
    return data?.skipAnimationDelay ? true : false;
  }, [data]);

  const pointAsString = derivedPoint.matchWith({
    Nothing: () => '',
    Just: (p: any) => p.value.toFixed(),
  });

  const { keyfile, filename } = useActivationKeyfileGenerator({
    pointId: point,
    wallets: [inviteWallet.value, inviteMasterTicketWallet.value],
  });

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

  const download = useCallback(async () => {
    await downloadWallet(paper.getOrElse([]), keyfile, filename);
  }, [paper, keyfile, filename]);

  const onDownloadClick = useCallback(async () => {
    await download();
    setIsIn(false);
    await timeout(DEFAULT_FADE_TIMEOUT); // Pause for UI fade animation
    push(names.CONFIRM);
  }, [download, setIsIn, push, names.CONFIRM]);

  const header = useMemo(() => {
    return (
      <Box>
        <ActivateHeader content={'Back up your Master Ticket.'} />
        <ActivateParagraph
          copy={
            'Download and store your backup somewhere safe, like a security deposit box or password manager.'
          }
        />
      </Box>
    );
  }, []);

  const footer = useMemo(() => {
    return (
      <ActivateButton onClick={onDownloadClick}>
        {'Download Backup (Passport)'}
      </ActivateButton>
    );
  }, [onDownloadClick]);

  const fadeIn = useCallback(() => {
    setTriggerAnimation(true);
    setIsIn(true);
  }, [setIsIn]);

  const delayedFadeIn = useCallback(async () => {
    setTimeout(() => {
      fadeIn();
    }, MASTER_KEY_DURATION);
  }, [fadeIn]);

  useEffect(() => {
    if (skipAnimationDelay) {
      fadeIn();
    } else {
      delayedFadeIn();
    }

    return () => {
      setIsIn(false);
    };
  }, [delayedFadeIn, fadeIn, setIsIn, skipAnimationDelay]);

  return (
    <View inset hideBack>
      <ActivateView
        hideBack
        header={triggerAnimation && header}
        footer={triggerAnimation && footer}>
        <Box
          alignItems={'center'}
          display={'flex'}
          flexDirection={'column'}
          flexWrap={'nowrap'}
          height={'100%'}
          justifyContent={'space-evenly'}>
          <DangerBox
            overrideFadeIn={triggerAnimation && isIn}
            className={`mv8 ${!isIn ? 'hidden' : ''}`}>
            Never share your Master Ticket with anyone.
          </DangerBox>
          {ticket && (
            <MasterKeyPresenter ticket={ticket} overrideFadeIn={true} />
          )}
          <MasterKeyCopy
            text={ticket}
            overrideFadeIn={triggerAnimation && isIn}
            className={`mv5 ${!isIn ? 'hidden' : ''}`}
          />
        </Box>
      </ActivateView>
      <ActivateSteps currentStep={1} totalSteps={4} />
      <PaperBuilder
        point={pointAsString}
        wallets={[wallet]}
        callback={(data: any) => {
          setPaper(Just(data));
        }}
      />
    </View>
  );
};

export default MasterKeyDownload;
