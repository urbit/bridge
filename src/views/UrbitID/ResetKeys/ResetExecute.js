import React, { useState, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, H4, Text, ErrorText } from 'indigo-react';

import {
  reticketPointBetweenWallets,
  TRANSACTION_PROGRESS,
} from 'lib/reticket';
import * as need from 'lib/need';
import useLifecycle from 'lib/useLifecycle';
import { WALLET_TYPES } from 'lib/constants';
import convertToInt from 'lib/convertToInt';
import useBlockWindowClose from 'lib/useBlockWindowClose';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useHistory } from 'store/history';

import { RestartButton, ForwardButton } from 'components/Buttons';
import WarningBox from 'components/WarningBox';
import LoadingBar from 'components/LoadingBar';
import NeedFundsNotice from 'components/NeedFundsNotice';

const labelForProgress = progress => {
  if (progress <= 0) {
    return 'Starting...';
  } else if (progress <= TRANSACTION_PROGRESS.GENERATING) {
    return 'Generating Ethereum Transactions...';
  } else if (progress <= TRANSACTION_PROGRESS.SIGNING) {
    return 'Signing Ethereum Transactions...';
  } else if (progress <= TRANSACTION_PROGRESS.FUNDING) {
    return 'Funding Ethereum Transactions...';
  } else if (progress <= TRANSACTION_PROGRESS.TRANSFERRING) {
    return 'Transferring ID...';
  } else if (progress <= TRANSACTION_PROGRESS.CLEANING) {
    return 'Cleaning Up...';
  } else if (progress <= TRANSACTION_PROGRESS.DONE) {
    return 'Done';
  }
};

export default function ResetExecute({ newWallet, setNewWallet }) {
  const { popTo, names, reset } = useHistory();
  const { web3, contracts, networkType } = useNetwork();
  const {
    wallet,
    setWalletType,
    resetWallet,
    setUrbitWallet,
    walletType,
    walletHdPath,
  } = useWallet();
  const { pointCursor } = usePointCursor();
  const { getDetails } = usePointCache();

  const [generalError, setGeneralError] = useState();
  const [progress, setProgress] = useState(0);
  const [needFunds, setNeedFunds] = useState();
  const isDone = progress >= 1.0;

  useBlockWindowClose();

  // start reticketing transactions on mount
  useLifecycle(() => {
    (async () => {
      const point = need.point(pointCursor);
      const details = need.details(getDetails(point));
      const networkRevision = convertToInt(details.keyRevisionNumber, 10);
      try {
        await reticketPointBetweenWallets({
          fromWallet: need.wallet(wallet),
          fromWalletType: walletType,
          fromWalletHdPath: walletHdPath,
          toWallet: newWallet.value.wallet,
          point: point,
          web3: need.web3(web3),
          contracts: need.contracts(contracts),
          networkType,
          onUpdate: handleUpdate,
          nextRevision: networkRevision + 1,
        });
      } catch (err) {
        console.error(err);
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
      console.log(generalError);
      generalError.message = generalError.message || 'Something went wrong!';
      return (
        <>
          <Grid.Item full className="mt4">
            <ErrorText>{generalError.message.toString()}</ErrorText>
          </Grid.Item>
          <Grid.Item
            full
            className="mt4"
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
        <Grid.Item full as={NeedFundsNotice} className="mt4" {...needFunds} />
      );
    }

    return (
      <Grid.Item full as={WarningBox} className="mt4">
        Never give your Master Key to anyone
      </Grid.Item>
    );
  };

  return (
    <Grid className="mt4">
      <Grid.Item full as={H4}>
        {labelForProgress(progress)}
      </Grid.Item>

      {isDone ? (
        <>
          <Grid.Item full as={Text} className="mt4">
            Your changes are now reflected on-chain and you can use the new
            ticket to manage your point.
          </Grid.Item>
          <Grid.Item
            full
            as={ForwardButton}
            solid
            className="mt4"
            accessory="↺"
            onClick={loginAndGoHome}>
            Login with New Master Key
          </Grid.Item>
        </>
      ) : (
        <>
          <Grid.Item full as={Grid} className="mt4" gap={3}>
            <Grid.Item full as={LoadingBar} progress={progress} />
            <Grid.Item full as={Text} className="f5 green4">
              This process can take up to 5 minutes to complete. Don't close
              this page until the process is complete.
            </Grid.Item>
          </Grid.Item>

          {renderAdditionalInfo()}
        </>
      )}
    </Grid>
  );
}
