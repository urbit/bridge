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

const MasterKeyTransfer = () => {
  const { api, transferPoint } = useRoller();
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
      const l2point = await api.getPoint(derivedPoint.value);
      await transferPoint({
        point: derivedPoint.value,
        to: derivedWallet.value.ownership.address,
        ownerAddress: l2point.ownership?.owner?.address!,
        toWallet: derivedWallet.value,
        fromWallet: inviteWallet.value,
      });
    } catch (error) {
      console.error(error);
      setError(error);
    }
  }, [api, derivedPoint.value, derivedWallet, inviteWallet, transferPoint]);

  useFadeIn();

  useLifecycle(() => {
    claimPoint();
  });

  const header = useMemo(() => {
    return (
      <ActivateHeader
        content={
          <>
            Congratulations{' '}
            <Text fontFamily="Source Code Pro" fontSize={3} fontWeight={600}>
              {derivedPatp.value}
            </Text>{' '}
            is now yours
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
          onClick={() =>
            window.open(
              'https://github.com/urbit/port/releases/latest/download/Port.dmg'
            )
          }
          success={true}
          disabled={error}>
          Download the Client for Mac
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
          textAlign={'center'}>
          or setup via command line
        </Anchor>
      </Box>
    );
  }, [error]);

  return (
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
  );
};

export default MasterKeyTransfer;
