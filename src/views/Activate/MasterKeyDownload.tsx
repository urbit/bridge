import React, { useCallback, useEffect, useMemo, useState } from 'react';

import ActivateView from './ActivateView';
import ActivateHeader from './ActivateHeader';
import { MasterKey } from './MasterKey';
import { Box, Button, Icon } from '@tlon/indigo-react';
import ActivateParagraph from './ActivateParagraph';
import { ActivateSteps } from './ActivateSteps';
import { useActivateFlow } from './ActivateFlow';
import { timeout } from 'lib/timeout';
import MasterKeyPresenter from './MasterKeyPresenter';

const MasterKeyDownload = () => {
  const { isFaded, setIsFaded } = useActivateFlow();

  const header = useMemo(() => {
    return (
      <Box className={isFaded ? 'faded-in' : 'faded-out'}>
        <ActivateHeader copy={'Backup your Master Key.'} />
        <ActivateParagraph
          copy={
            'Download your backup and store it somewhere safe, e.g. your security deposit box or password manager.'
          }
        />
      </Box>
    );
  }, [isFaded]);

  const footer = useMemo(() => {
    return (
      <Box
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
        height={'100%'}
        className={isFaded ? 'faded-in' : 'faded-out'}
        justifyContent="flex-end">
        <Button
          onClick={() => console.log('reveal')}
          backgroundColor="black"
          color={'white'}
          padding={'16px'}
          fontFamily="Inter"
          height={'50px'}
          fontWeight={'400'}
          fontSize={'18px'}>
          Download Backup
        </Button>
      </Box>
    );
  }, [isFaded]);

  const onViewTransition = useCallback(async () => {
    setIsFaded(true);
    await timeout(500); // Pause for UI fade animation
  }, [setIsFaded]);

  useEffect(() => {
    // Fade in content
    onViewTransition();
  }, [onViewTransition]);

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
            <MasterKeyPresenter />
          </Box>
        </Box>
      </ActivateView>
      <ActivateSteps currentStep={1} totalSteps={4} />
    </>
  );
};

export default MasterKeyDownload;
