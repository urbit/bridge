import React, { useState, useCallback } from 'react';

import { Grid, H4, Text, ErrorText } from 'indigo-react';
import { RestartButton } from 'components/Buttons';
import WarningBox from 'components/WarningBox';
import LoadingBar from 'components/LoadingBar';
import Highlighted from 'components/Highlighted';

import { claimPointFromInvite } from 'lib/invite';
import { fromWei } from 'lib/txn';

import * as need from 'lib/need';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import useLifecycle from 'lib/useLifecycle';

//TODO maybe we want to drop in PassportTransfer here?
export default function DoReticket({ newWallet, completed }) {
  const { web3, contracts } = useNetwork();
  const { wallet, setUrbitWallet } = useWallet();
  const { pointCursor } = usePointCursor();

  const [generalError, setGeneralError] = useState();
  const [{ label, progress }, setState] = useState({
    label: 'Starting...',
    progress: 0,
  });
  const [needFunds, setNeedFunds] = useState();

  // start reticketing transactions on mount
  useLifecycle(() => {
    claimPointFromInvite({
      inviteWallet: need.wallet(wallet),
      wallet: newWallet.value.wallet,
      point: need.point(pointCursor),
      web3: need.web3(web3),
      contracts: need.contracts(contracts),
      onUpdate: handleUpdate,
    })
      .then(() => {
        setUrbitWallet(newWallet.value.wallet);
        completed(); //TODO don't auto-redirect
      })
      .catch(err => {
        setGeneralError(err);
      });
  });

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
            //TODO onClick={goToRestart}
          />
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

    if (progress < 100) {
      return (
        <Grid.Item full as={WarningBox} className="mt8">
          Never give your Master Ticket to anyone
        </Grid.Item>
      );
    }

    return null;
  };

  return (
    <Grid className={'auto-rows-min'}>
      <Grid.Item full as={H4}>
        {label}
      </Grid.Item>
      <Grid.Item full as={Grid} className="mt3" gap={3}>
        <Grid.Item full as={LoadingBar} progress={progress} />
        <Grid.Item full>
          <Text className="f5 green4">
            This process can take up to 5 minutes to complete. Don't leave this
            page until the process is complete.
          </Text>
        </Grid.Item>
      </Grid.Item>

      {renderAdditionalInfo()}
    </Grid>
  );
}
