import React, { useState, useCallback, useMemo } from 'react';

import useLifecycle from 'lib/useLifecycle';

import { Anchor, Box, Text } from '@tlon/indigo-react';
import { useActivateFlow } from './ActivateFlow';
import ActivateView from './ActivateView';
import useRoller from 'lib/useRoller';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { FadeableActivateButton as ActivateButton } from './ActivateButton';
import useFadeIn from './useFadeIn';
import PointPresenter from './PointPresenter';
import DangerBox from './DangerBox';
import View from 'components/View';

import { isMacOs, isWindows } from 'react-device-detect';

const MasterKeyTransfer = () => {
  const { performL2Reticket } = useRoller();
  const {
    derivedPatp,
    derivedPoint,
    derivedWallet,
    inviteWallet,
  } = useActivateFlow();
  const [error, setError] = useState();

  const claimPoint = useCallback(async () => {
    setError(undefined);

    try {
      await performL2Reticket({
        point: derivedPoint.value,
        to: derivedWallet.value.ownership.keys.address,
        manager: derivedWallet.value.management.keys.address,
        toWallet: derivedWallet.value,
        fromWallet: inviteWallet.value,
      });
    } catch (error) {
      console.error(error);
      setError(error);
    }
  }, [
    derivedWallet,
    performL2Reticket,
    derivedPoint.value,
    inviteWallet.value,
  ]);

  const downloadButtonLabel = useMemo(() => {
    return isMacOs
      ? 'Download the Client for Mac'
      : isWindows
      ? 'Download the Client for Windows'
      : 'Download the Client for Your OS';
  }, []);

  const downloadUrl = useMemo(() => {
    return isMacOs
      ? `https://github.com/urbit/port/releases/latest/download/Port.dmg`
      : isWindows
      ? 'https://github.com/urbit/urbit/releases/download/latest/windows.tgz'
      : 'https://github.com/urbit/port/releases/download/latest';
  }, []);

  useFadeIn();

  useLifecycle(() => {
    claimPoint();
  });

  const header = useMemo(() => {
    return (
      <ActivateHeader
        content={
          <>
            <Text
              display={'block'}
              fontFamily={'Inter'}
              fontStyle={'normal'}
              fontWeight={'600'}
              fontSize={'16px'}
              lineHeight={'24px'}>
              Congratulations
            </Text>
            <Text
              fontFamily="Source Code Pro"
              fontSize={'16px'}
              fontWeight={600}>
              {derivedPatp.value}
            </Text>
            &nbsp;
            <Text
              fontFamily={'Inter'}
              fontStyle={'normal'}
              fontWeight={'600'}
              fontSize={'16px'}
              lineHeight={'24px'}>
              is now yours
            </Text>
          </>
        }
      />
    );
  }, [derivedPatp.value]);

  const footer = useMemo(() => {
    return (
      <Box
        display={'flex'}
        flexDirection={'column'}
        flexWrap={'nowrap'}
        justifyContent={'space-between'}>
        {error && <DangerBox>{error.toString()}</DangerBox>}
        <ActivateButton
          onClick={() => window.open(downloadUrl)}
          disabled={error}
          success={true}>
          {downloadButtonLabel}
        </ActivateButton>
        <Anchor
          href="https://urbit.org/getting-started/cli"
          marginTop={'20px'}
          marginBottom={'10px'}
          underline={false}
          fontFamily={'Inter'}
          fontSize={'14px'}
          fontWeight={'500'}
          lineHeight={'16px'}
          textAlign={'center'}
          target={'_blank'}
          rel={'nofollow noopener'}>
          or setup via command line
        </Anchor>
      </Box>
    );
  }, [downloadButtonLabel, downloadUrl, error]);

  return (
    <View centered={true}>
      <ActivateView header={header} footer={footer}>
        <Box
          alignItems={'center'}
          display={'flex'}
          flexDirection={'column'}
          flexWrap={'nowrap'}
          height={'100%'}
          justifyContent={'center'}>
          <PointPresenter
            patp={derivedPatp.value}
            showLabel={false}
            success={true}
          />
        </Box>
      </ActivateView>
    </View>
  );
};

export default MasterKeyTransfer;
