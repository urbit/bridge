import React, { useState, useCallback } from 'react';
import { Grid, H4, Text, ErrorText } from 'indigo-react';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useLifecycle from 'lib/useLifecycle';
import { claimPointFromInvite } from 'lib/invite';
import timeout from 'lib/timeout';
import { fromWei } from 'lib/txn';

import Steps from 'components/Steps';
import WarningBox from 'components/WarningBox';
import LoadingBar from 'components/LoadingBar';
import Highlighted from 'components/Highlighted';

import { useActivateFlow } from './ActivateFlow';

export default function PassportTransfer({ className }) {
  const { replaceWith, names } = useHistory();
  const { setUrbitWallet } = useWallet();
  const { setPointCursor } = usePointCursor();
  const { web3, contracts } = useNetwork();
  const { derivedWallet, derivedPoint, inviteWallet } = useActivateFlow();
  const [generalError, setGeneralError] = useState();
  const [{ label, progress }, setState] = useState({
    label: 'Verify Passport',
    progress: 0,
  });
  const [needFunds, setNeedFunds] = useState();

  const goToLogin = useCallback(
    () =>
      replaceWith([
        { key: names.LANDING },
        { key: names.LOGIN },
        { key: names.POINTS },
        { key: names.POINT },
      ]),
    [replaceWith, names]
  );

  const goToRestart = useCallback(
    () => replaceWith([{ key: names.LANDING }, { key: names.ACTIVATE }]),
    [replaceWith, names]
  );

  const handleUpdate = useCallback(
    ({ type, state, value }) => {
      switch (type) {
        case 'progress':
          return setState(state);
        case 'askFunding':
          return setNeedFunds(value);
        case 'gotFunding':
          return setNeedFunds(false);
        default:
          console.error(`Unknown update: ${type}`);
      }
    },
    [setState, setNeedFunds]
  );

  const claimPoint = useCallback(async () => {
    const _inviteWallet = need.wallet(inviteWallet);
    const _wallet = need.wallet(derivedWallet);
    const _point = need.point(derivedPoint);
    const _web3 = need.web3(web3);
    const _contracts = need.contracts(contracts);

    try {
      await claimPointFromInvite({
        inviteWallet: _inviteWallet,
        wallet: _wallet,
        point: _point,
        web3: _web3,
        contracts: _contracts,
        onUpdate: handleUpdate,
      });
      // set the global wallet
      setUrbitWallet(derivedWallet);
      setPointCursor(derivedPoint);
      await timeout(3000);
      // and redirect to login
      goToLogin();
    } catch (error) {
      // some generic error
      setGeneralError(error);
    }
  }, [
    inviteWallet,
    derivedWallet,
    derivedPoint,
    web3,
    contracts,
    setUrbitWallet,
    setPointCursor,
    handleUpdate,
    goToLogin,
  ]);

  useLifecycle(() => {
    claimPoint();
  });

  return (
    <Grid gap={4} className={className}>
      <Grid.Item full as={Steps} num={2} total={3} />
      <Grid.Item full as={H4}>
        {label}
      </Grid.Item>
      <Grid.Item full as={Grid}>
        <Grid.Item full as={LoadingBar} progress={progress} />
        <Grid.Item full>
          <Text className="f5 green4">
            This process can take up to 5 minutes to complete. Don't leave this
            page until the process is complete.
          </Text>
        </Grid.Item>
      </Grid.Item>

      {progress < 0 && (
        <Grid.Item full as={WarningBox}>
          Never give your Master Ticket to anyone
        </Grid.Item>
      )}

      {needFunds && (
        <Grid.Item full>
          <Highlighted>
            The address {needFunds.address} needs at least{' '}
            {fromWei(needFunds.minBalance)} ETH and currently has{' '}
            {fromWei(needFunds.balance)} ETH. Waiting until the account has
            enough funds.
          </Highlighted>
        </Grid.Item>
      )}

      {generalError && (
        <Grid.Item full>
          <ErrorText>{generalError.message.toString()}</ErrorText>
        </Grid.Item>
      )}
    </Grid>
  );
}
