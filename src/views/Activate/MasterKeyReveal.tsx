import React, { useCallback, useEffect, useMemo, useState } from 'react';

import ActivateView from './ActivateView';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { MasterKey } from './MasterKey';
import { Box, Icon } from '@tlon/indigo-react';
import { FadeableActivateParagraph as ActivateParagraph } from './ActivateParagraph';
import { FadeableActivateSteps as ActivateSteps } from './ActivateSteps';
import { useActivateFlow } from './ActivateFlow';
import { timeout } from 'lib/timeout';
import { useLocalRouter } from 'lib/LocalRouter';
import { FadeableActivateButton as ActivateButton } from './ActivateButton';

const MasterKeyReveal = () => {
  const { setIsIn } = useActivateFlow();
  const { push, names } = useLocalRouter();
  const [showMasterKey, setShowMasterKey] = useState<boolean>(false);
  const [triggerAnimation, setTriggerAnimation] = useState<boolean>(false);

  const goToDownload = useCallback(() => {
    push(names.DOWNLOAD);
  }, [names.DOWNLOAD, push]);

  const onRevealClick = useCallback(async () => {
    setShowMasterKey(true);
    await timeout(500); // Pause for UI fade animation
    goToDownload();
  }, [goToDownload]);

  const header = useMemo(() => {
    return triggerAnimation ? (
      <Box>
        <ActivateHeader copy={'Here is your Master Key.'} />
        <ActivateParagraph
          copy={
            "Your Master Key is your 4-word password for your Urbit. Make sure you're in a private place before you reveal it."
          }
        />
      </Box>
    ) : null;
  }, [triggerAnimation]);

  const footer = useMemo(() => {
    return triggerAnimation ? (
      <ActivateButton onClick={onRevealClick}>
        <Icon
          display="inline-block"
          icon="Visible"
          size="18px"
          color={'white'}
        />
        &nbsp; Reveal
      </ActivateButton>
    ) : null;
  }, [onRevealClick, triggerAnimation]);

  const delayedFadeIn = useCallback(async () => {
    setTimeout(() => {
      setTriggerAnimation(true);
      setIsIn(true);
    }, 1200);
  }, [setIsIn]);

  useEffect(() => {
    delayedFadeIn();

    return () => {
      setIsIn(false);
    };
  }, [delayedFadeIn, setIsIn]);

  return (
    <>
      <ActivateView header={header} footer={footer}>
        <Box
          alignItems={'center'}
          display={'flex'}
          flexDirection={'column'}
          flexWrap={'nowrap'}
          height={'100%'}
          justifyContent={'center'}>
          <Box
            display={'flex'}
            flexDirection={'row'}
            flexWrap={'nowrap'}
            width={'80%'}
            height={'min-content'}
            justifyContent={'center'}>
            <MasterKey />
          </Box>
        </Box>
      </ActivateView>
      {triggerAnimation && <ActivateSteps currentStep={0} totalSteps={4} />}
    </>
  );
};

export default MasterKeyReveal;
