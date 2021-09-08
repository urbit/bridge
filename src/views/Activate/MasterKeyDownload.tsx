import React, { useCallback, useEffect, useMemo, useState } from 'react';

import ActivateView from './ActivateView';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { Box } from '@tlon/indigo-react';
import ActivateParagraph from './ActivateParagraph';
import { ActivateSteps } from './ActivateSteps';
import { FadeableMasterKeyPresenter as MasterKeyPresenter } from './MasterKeyPresenter';
import { FadeableActivateButton as ActivateButton } from './ActivateButton';
import { useActivateFlow } from './ActivateFlow';

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
          justifyContent={'center'}>
          {/* AlertBox */}
          <Box
            display={'flex'}
            flexDirection={'row'}
            flexWrap={'nowrap'}
            width={'80%'}
            height={'min-content'}
            justifyContent={'center'}>
            <MasterKeyPresenter fadeIn={true} />
          </Box>
          {/* <CopyButton text={'test'} /> */}
        </Box>
      </ActivateView>
      <ActivateSteps currentStep={1} totalSteps={4} />
    </>
  );
};

export default MasterKeyDownload;
