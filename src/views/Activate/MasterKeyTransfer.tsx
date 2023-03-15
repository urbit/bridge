import React, { useState, useCallback, useMemo } from 'react';

import useLifecycle from 'lib/useLifecycle';

import { Anchor, Box, Text } from '@tlon/indigo-react';
import { useActivateFlow } from './useActivateFlow';
import ActivateView from './ActivateView';
import useRoller from 'lib/useRoller';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import useFadeIn from './useFadeIn';
import PointPresenter from './PointPresenter';
import DangerBox from './DangerBox';
import View from 'components/View';

import { DownloadPortButton } from './DownloadPortButton';

const MasterKeyTransfer = () => {
  const { performL2Reticket } = useRoller();
  const {
    derivedPatp,
    derivedPoint,
    inviteMasterTicketWallet,
    sendWallet,
  }: any = useActivateFlow();
  const [error, setError] = useState<any>();

  const claimPoint = useCallback(async () => {
    setError(undefined);

    try {
      await performL2Reticket({
        point: derivedPoint.value,
        to: inviteMasterTicketWallet.value.ownership.keys.address,
        manager: inviteMasterTicketWallet.value.management.keys.address,
        toWallet: inviteMasterTicketWallet.value,
        fromWallet: sendWallet.value,
      });
    } catch (e) {
      console.error(e);
      setError(e);
    }
  }, [
    inviteMasterTicketWallet,
    performL2Reticket,
    derivedPoint.value,
    sendWallet.value,
  ]);

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
              Congratulations,
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
              is now yours.
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
        <DownloadPortButton error={error} />
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
        <p
          className="mb2 sans gray5"
          style={{ fontSize: 14, textAlign: 'center' }}>
          You need your Network Key to boot your Urbit ID. You can find your
          Network Key file inside the Passport you downloaded. A computer
          running on the Urbit network is called a ship.
        </p>
      </Box>
    );
  }, [error]);

  return (
    <View inset hideBack>
      <ActivateView hideBack header={header} footer={footer}>
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
