import React, { useState, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, H4, Text, ErrorText } from 'indigo-react';
import { fromWei } from 'web3-utils';

import {
  reticketPointBetweenWallets,
  TRANSACTION_PROGRESS,
} from 'lib/reticket';
import * as need from 'lib/need';
import useLifecycle from 'lib/useLifecycle';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useHistory } from 'store/history';

import { RestartButton, ForwardButton } from 'components/Buttons';
import WarningBox from 'components/WarningBox';
import LoadingBar from 'components/LoadingBar';
import Highlighted from 'components/Highlighted';
import { WALLET_TYPES } from 'lib/wallet';

const labelForProgress = progress => {
  if (progress <= 0) {
    return 'Starting...';
  } else if (progress <= TRANSACTION_PROGRESS.GENERATING) {
    return 'Generating Transactions...';
  } else if (progress <= TRANSACTION_PROGRESS.SIGNING) {
    return 'Signing Transactions...';
  } else if (progress <= TRANSACTION_PROGRESS.FUNDING) {
    return 'Funding Transactions...';
  } else if (progress <= TRANSACTION_PROGRESS.TRANSFERRING) {
    return 'Transferring Point...';
  } else if (progress <= TRANSACTION_PROGRESS.CLEANING) {
    return 'Cleaning Up...';
  } else if (progress <= TRANSACTION_PROGRESS.DONE) {
    return 'Done';
  }
};

export default function ReticketExecute({ newWallet, setNewWallet }) {
  const { popTo, names, reset } = useHistory();
  const { web3, contracts } = useNetwork();
  const { wallet, setWalletType, resetWallet, setUrbitWallet } = useWallet();
  const { pointCursor } = usePointCursor();
  const { getDetails } = usePointCache();

  const [generalError, setGeneralError] = useState();
  const [progress, setProgress] = useState(0);
  const [needFunds, setNeedFunds] = useState();
  const isDone = progress >= 1.0;

  // start reticketing transactions on mount
  useLifecycle(() => {
    (async () => {
      const point = need.point(pointCursor);
      const details = need.details(getDetails(point));
      const networkRevision = parseInt(details.keyRevisionNumber, 10);
      try {
        await reticketPointBetweenWallets({
          fromWallet: need.wallet(wallet),
          toWallet: newWallet.value.wallet,
          point: point,
          web3: need.web3(web3),
          contracts: need.contracts(contracts),
          onUpdate: handleUpdate,
          nextRevision: networkRevision + 1,
        });
      } catch (err) {
        setGeneralError(err);
      }
    })();
  });

  const goToRestart = useCallback(() => {
    reset();
    setNewWallet(Nothing());
  }, [reset, setNewWallet]);

  const loginAndGoHome = useCallback(() => {
    // set wallet state
    resetWallet();
    setWalletType(WALLET_TYPES.TICKET);
    setUrbitWallet(Just(newWallet.value.wallet));
    // (implicit) pointCursor stays the same
    // rediect to point
    popTo(names.POINT);
  }, [resetWallet, setWalletType, setUrbitWallet, newWallet, popTo, names]);

  const handleUpdate = useCallback(
    ({ type, state, value }) => {
      switch (type) {
        case 'progress':
          return setProgress(state);
        case 'askFunding':
          return setNeedFunds(value);
        case 'gotFunding':
          return setNeedFunds(false);
        default:
          console.error(`Unknown update: ${type}`);
      }
    },
    [setProgress, setNeedFunds]
  );

  const renderAdditionalInfo = () => {
    if (generalError) {
      return (
        <>
          <Grid.Item full>
            <ErrorText>{generalError.message.toString()}</ErrorText>
          </Grid.Item>
          <Grid.Item
            full
            className="mt3"
            as={RestartButton}
            solid
            onClick={goToRestart}>
            Restart
          </Grid.Item>
        </>
      );
    }

    if (needFunds) {
      return (
        <Grid.Item full>
          <Highlighted warning>
            The address {needFunds.address} needs at least{' '}
            {fromWei(needFunds.minBalance)} ETH and currently has{' '}
            {fromWei(needFunds.balance)} ETH. Waiting until the account has
            enough funds.
          </Highlighted>
        </Grid.Item>
      );
    }

    return (
      <Grid.Item full as={WarningBox}>
        Never give your Master Ticket to anyone
      </Grid.Item>
    );
  };

  return (
    <Grid gap={4} className="mt4">
      <Grid.Item full as={H4}>
        {labelForProgress(progress)}
      </Grid.Item>

      {isDone ? (
        <>
          <Grid.Item full as={Text}>
            Your changes are now reflected on-chain and you can use the new
            ticket to manage your point.
          </Grid.Item>
          <Grid.Item
            full
            as={ForwardButton}
            solid
            accessory="↺"
            onClick={loginAndGoHome}>
            Login with New Master Ticket
          </Grid.Item>
        </>
      ) : (
        <>
          <Grid.Item full as={Grid} className="mt3" gap={3}>
            <Grid.Item full as={LoadingBar} progress={progress} />
            <Grid.Item full>
              <Text className="f5 green4">
                This process can take up to 5 minutes to complete. Don't close
                this page until the process is complete.
              </Text>
            </Grid.Item>
          </Grid.Item>

          {renderAdditionalInfo()}
        </>
      )}
    </Grid>
  );
}
