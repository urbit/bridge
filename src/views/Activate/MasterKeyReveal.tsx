import React, { useCallback, useEffect, useMemo, useState } from 'react';

import ActivateView from './ActivateView';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { FadeableMasterKey as MasterKey } from './MasterKey';
import { Box, Icon } from '@tlon/indigo-react';
import { FadeableActivateParagraph as ActivateParagraph } from './ActivateParagraph';
import { FadeableActivateSteps as ActivateSteps } from './ActivateSteps';
import { useActivateFlow } from './ActivateFlow';
import { timeout } from 'lib/timeout';
import { useLocalRouter } from 'lib/LocalRouter';
import { FadeableActivateButton as ActivateButton } from './ActivateButton';
import { DEFAULT_FADE_TIMEOUT, MASTER_KEY_DURATION } from 'lib/constants';
import View from 'components/View';

const MasterKeyReveal = () => {
  const { setIsIn } = useActivateFlow();
  const { push, names } = useLocalRouter();
  const [triggerAnimation, setTriggerAnimation] = useState<boolean>(false);
  const [fadeOutKey, setFadeOutKey] = useState<boolean>(false);

  const goToDownload = useCallback(() => {
    push(names.DOWNLOAD);
  }, [names.DOWNLOAD, push]);

  const onRevealClick = useCallback(async () => {
    setTriggerAnimation(false);
    setIsIn(false);
    setFadeOutKey(true);
    await timeout(DEFAULT_FADE_TIMEOUT); // Pause for UI fade animation
    goToDownload();
  }, [goToDownload, setIsIn]);

  const header = useMemo(() => {
    return (
      <Box>
        <ActivateHeader content={'Here is your Master Ticket.'} />
        <ActivateParagraph
          copy={
            "Your Master Ticket is your 4-word password for your Urbit. Make sure you're in a private place before you reveal it."
          }
        />
      </Box>
    );
  }, []);

  const footer = useMemo(() => {
    return (
      <ActivateButton onClick={onRevealClick}>
        <Icon
          display="inline-block"
          icon="Visible"
          size="18px"
          color={'white'}
        />
        &nbsp; Reveal
      </ActivateButton>
    );
  }, [onRevealClick]);

  const delayedFadeIn = useCallback(async () => {
    setTimeout(() => {
      setTriggerAnimation(true);
      setIsIn(true);
    }, MASTER_KEY_DURATION);
  }, [setIsIn]);

  useEffect(() => {
    delayedFadeIn();

    return () => {
      setIsIn(false);
    };
  }, [delayedFadeIn, setIsIn]);

  return (
    <View centered={true}>
      <ActivateView
        header={triggerAnimation && header}
        footer={triggerAnimation && footer}>
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
            <MasterKey overrideFadeIn={!fadeOutKey} />
          </Box>
        </Box>
      </ActivateView>
      {triggerAnimation && (
        <ActivateSteps currentStep={0} totalSteps={4} overrideFadeIn={true} />
      )}
    </View>
  );
};

export default MasterKeyReveal;
