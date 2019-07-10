import React, { useState, useCallback } from 'react';
import { Grid, Text, ErrorText } from 'indigo-react';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useLifecycle from 'lib/useLifecycle';
import { reticketPointBetweenWallets } from 'lib/invite';
import timeout from 'lib/timeout';
import { fromWei } from 'lib/txn';

import WarningBox from 'components/WarningBox';
import LoadingBar from 'components/LoadingBar';
import Highlighted from 'components/Highlighted';
import { RestartButton } from 'components/Buttons';

import { useActivateFlow } from './ActivateFlow';
import PassportView from './PassportView';

export default function PassportTransfer({ className, resetActivateRouter }) {
  const { replaceWith, names } = useHistory();
  const { setUrbitWallet } = useWallet();
  const { setPointCursor } = usePointCursor();
  const { web3, contracts } = useNetwork();
  const {
    derivedWallet,
    derivedPoint,
    inviteWallet,
    reset: resetActivateFlow,
  } = useActivateFlow();
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

  const goToRestart = useCallback(() => {
    // NOTE: because we're already on the ACTIVATE view in the history,
    // react (intelligently) doesn't trigger a re-render and that means the
    // current state of the two nested routers (activate & passport) stick
    // around unless we manually clear them.
    // we only need to clear activate because that will unmount the passport
    // router (which will be set to initialRoutes when mounted again)

    // 1) replace history
    replaceWith([{ key: names.LANDING }, { key: names.ACTIVATE }]);
    // 2) reset local router
    resetActivateRouter();
    // 3) clear the state
    resetActivateFlow();
  }, [replaceWith, names, resetActivateRouter, resetActivateFlow]);

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
    setGeneralError(false);

    try {
      const _inviteWallet = need.wallet(inviteWallet);
      const _wallet = need.wallet(derivedWallet);
      const _point = need.point(derivedPoint);
      const _web3 = need.web3(web3);
      const _contracts = need.contracts(contracts);

      await reticketPointBetweenWallets({
        fromWallet: _inviteWallet,
        toWallet: _wallet,
        point: _point,
        web3: _web3,
        contracts: _contracts,
        onUpdate: handleUpdate,
        transferEth: true,
      });

      // set the global wallet
      setUrbitWallet(derivedWallet);
      setPointCursor(derivedPoint);

      // and redirect to login
      await timeout(3000);
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

  const renderAdditionalInfo = () => {
    if (generalError) {
      return (
        <>
          <Grid.Item full className="mt8">
            <ErrorText>{generalError.message.toString()}</ErrorText>
          </Grid.Item>
          <Grid.Item
            full
            className="mt3"
            as={RestartButton}
            onClick={goToRestart}>
            Restart
          </Grid.Item>
        </>
      );
    }

    if (needFunds) {
      return (
        <Grid.Item full className="mt8">
          <Highlighted>
            The address {needFunds.address} needs at least{' '}
            {fromWei(needFunds.minBalance)} ETH and currently has{' '}
            {fromWei(needFunds.balance)} ETH. Waiting until the account has
            enough funds.
          </Highlighted>
        </Grid.Item>
      );
    }

    if (progress < 1.0) {
      return (
        <Grid.Item full as={WarningBox} className="mt8">
          Never give your Master Ticket to anyone
        </Grid.Item>
      );
    }

    return null;
  };

  return (
    <PassportView className={className} header={label} step={3}>
      <Grid>
        <Grid.Item full as={Grid} className="mt3" gap={3}>
          <Grid.Item full as={LoadingBar} progress={progress} />
          <Grid.Item full>
            <Text className="f5 green4">
              This process can take up to 5 minutes to complete. Don't leave
              this page until the process is complete.
            </Text>
          </Grid.Item>
        </Grid.Item>

        {renderAdditionalInfo()}
      </Grid>
    </PassportView>
  );
}
