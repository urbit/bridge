import React, { useMemo } from 'react';

import ActivateView from './ActivateView';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { Box } from '@tlon/indigo-react';
import ActivateParagraph from './ActivateParagraph';
import { FadeableActivateSteps as ActivateSteps } from './ActivateSteps';
import MasterKeyPresenter from './MasterKeyPresenter';
import { FadeableActivateButton as ActivateButton } from './ActivateButton';
import useFadeIn from './useFadeIn';

const MasterKeyDownload = () => {
  const header = useMemo(() => {
    return (
      <Box>
        <ActivateHeader copy={'Backup your Master Key.'} />
        <ActivateParagraph
          copy={
            'Download your backup and store it somewhere safe, e.g. your security deposit box or password manager.'
          }
        />
      </Box>
    );
  }, []);

  const footer = useMemo(() => {
    return (
      <ActivateButton onClick={() => console.log('download')}>
        Download Backup
      </ActivateButton>
    );
  }, []);

  useFadeIn();

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
            <MasterKeyPresenter />
          </Box>
          {/* <CopyButton text={'test'} /> */}
        </Box>
      </ActivateView>
      <ActivateSteps currentStep={1} totalSteps={4} />
    </>
  );
};

export default MasterKeyDownload;
