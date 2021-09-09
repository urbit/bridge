import React, { useCallback, useEffect, useMemo, useState } from 'react';

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

const MasterKeyDownload = () => {
  const { setIsIn } = useActivateFlow();
  const [triggerAnimation, setTriggerAnimation] = useState<boolean>(false);

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
      <ActivateButton onClick={() => console.log('download')}>
        Download Backup
      </ActivateButton>
    ) : null;
  }, [triggerAnimation]);

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
          <MasterKeyPresenter fadeIn={true} />
          {triggerAnimation && <MasterKeyCopy text={'test'} />}
        </Box>
      </ActivateView>
      <ActivateSteps currentStep={1} totalSteps={4} />
    </>
  );
};

export default MasterKeyDownload;
