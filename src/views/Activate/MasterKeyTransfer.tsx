import React, { useState, useCallback, useMemo, useEffect } from 'react';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useLifecycle from 'lib/useLifecycle';
import useBlockWindowClose from 'lib/useBlockWindowClose';
import { reticketPointBetweenWallets } from 'lib/reticket';

import { Anchor, Box, Text } from '@tlon/indigo-react';
import { useActivateFlow } from './ActivateFlow';
import ActivateView from './ActivateView';
import { POINT_DOMINIONS } from 'lib/constants';
import { From } from '@urbit/roller-api';
import useRoller from 'lib/useRoller';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { FadeableActivateButton as ActivateButton } from './ActivateButton';
import useFadeIn from './useFadeIn';
import PointPresenter from './PointPresenter';

const MasterKeyTransfer = ({ className, resetActivateRouter }) => {
  const { replaceWith, names } = useHistory();
  const { setUrbitWallet } = useWallet();
  const { setPointCursor } = usePointCursor();
  const { web3, contracts, networkType } = useNetwork();
  const { api, transferPoint } = useRoller();
  const {
    derivedPatp,
    derivedPoint,
    derivedPointDominion,
    derivedWallet,
    inviteWallet,
    reset: resetActivateFlow,
  } = useActivateFlow();
  const [generalError, setGeneralError] = useState();
  const [progress, setProcesss] = useState(0);
  const [needFunds, setNeedFunds] = useState();

  // const [transferTxHash, setTransferTxHash] = useState<string | null>(null);

  const _inviteWallet = need.wallet(inviteWallet);
  const _wallet = need.wallet(derivedWallet);
  const _point = need.point(derivedPoint);
  const _web3 = need.web3(web3);
  const _contracts = need.contracts(contracts);

  const goToLogin = useCallback(
    () => replaceWith([{ key: names.LOGIN }, { key: names.POINT }]),
    [replaceWith, names]
  );

  const goToRestart = useCallback(() => {
    // NOTE: because we're already on the ACTIVATE view in the history,
    // react (intelligently) doesn't trigger a re-render and that means the
    // current state of the two nested routers (activate & passport) stick
    // around unless we manually clear them.
    // we only need to clear activate because that will unmount the passport
    // router (which will be set to initialRoutes when mounted again)

    // 2) reset local router
    resetActivateRouter();
    // 3) clear the state
    resetActivateFlow();
  }, [resetActivateRouter, resetActivateFlow]);

  const claimL2Point = useCallback(async () => {
    console.log('claiming l2 point:');
    const transferFrom: From = {
      ship: derivedPatp.value,
      proxy: 'transfer',
    };

    const l2point = await api.getPoint(derivedPoint.value);
    const fromAddress = l2point.ownership?.owner?.address!;
    const txHash = await transferPoint({
      point: derivedPoint.value,
      from: transferFrom,
      to: _inviteWallet.address,
      fromAddress: fromAddress,
      signingKey: derivedWallet.value.ownership.keys.private,
    });

    // setTransferTxHash(txHash);
  }, [
    _inviteWallet.address,
    api,
    derivedPatp.value,
    derivedPoint.value,
    derivedWallet.value,
    transferPoint,
  ]);

  // const claimL1Point = useCallback(async () => {
  //   await reticketPointBetweenWallets({
  //     fromWallet: _inviteWallet,
  //     toWallet: _wallet,
  //     point: _point,
  //     web3: _web3,
  //     contracts: _contracts,
  //     networkType,
  //     onUpdate: handleUpdate,
  //     transferEth: true,
  //     //NOTE  not passing wc function, we always have invite ticket wallet
  //   });
  // }, [_contracts, _inviteWallet, _point, _wallet, _web3, networkType]);

  const claimPoint = useCallback(async () => {
    setGeneralError(false);

    try {
      // If L2
      if (derivedPointDominion.value === POINT_DOMINIONS.L2) {
        await claimL2Point();
      } else {
        // await claimL1Point();
        console.log('do nothing for now');
      }

      // If L1

      // set the global wallet
      // setUrbitWallet(derivedWallet);
      // setPointCursor(derivedPoint);

      // and redirect to login
      // await timeout(3000);
      // goToLogin();
    } catch (error) {
      console.error(error);
      // some generic error
      setGeneralError(error);
    }
  }, [derivedPointDominion, claimL2Point]);

  // useBlockWindowClose();
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
        <ActivateButton
          onClick={() =>
            window.open(
              'https://github.com/urbit/port/releases/latest/download/Port.dmg'
            )
          }
          success={true}>
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
  }, []);

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
