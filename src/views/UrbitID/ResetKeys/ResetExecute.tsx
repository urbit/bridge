import React, { useState, useCallback, useEffect } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, H4, Text, ErrorText } from 'indigo-react';

import {
  reticketPointBetweenWallets,
  TRANSACTION_PROGRESS,
} from 'lib/reticket';
import * as need from 'lib/need';
import { POINT_DOMINIONS, WALLET_TYPES } from 'lib/constants';
import { convertToInt } from 'lib/convertToInt';
import useBlockWindowClose from 'lib/useBlockWindowClose';
import { useReticketL2Spawn } from 'lib/useReticketL2Spawn';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useHistory } from 'store/history';
import { useRollerStore } from 'store/rollerStore';

import useRoller from 'lib/useRoller';
import { useWalletConnect } from 'lib/useWalletConnect';

import { RestartButton, ForwardButton } from 'components/Buttons';
import WarningBox from 'components/WarningBox';
import LoadingBar from 'components/LoadingBar';
import NeedFundsNotice from 'components/NeedFundsNotice';
import { ReticketProgressCallback } from 'lib/types/L2Transaction';

const labelForProgress = (progress: number) => {
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

interface ResetExecuteProps {
  // a Maybe<UrbitWallet>
  newWallet: any;
  // a useState setter, accepts Maybe<UrbitWallet>
  setNewWallet: (args: any) => {};
}

export default function ResetExecute({
  newWallet,
  setNewWallet,
}: ResetExecuteProps) {
  const { popTo, names, reset }: any = useHistory();
  const { web3, contracts, networkType }: any = useNetwork();
  const {
    wallet,
    setWalletType,
    resetWallet,
    setUrbitWallet,
    walletType,
    walletHdPath,
  }: any = useWallet();
  const { api, performL2Reticket } = useRoller();
  const {
    point: { isL2 },
  } = useRollerStore();
  const { pointCursor }: any = usePointCursor();
  const { getDetails }: any = usePointCache();
  const {
    signTransaction: wcSign,
    sendTransaction: wcSend,
    connector,
  } = useWalletConnect();
  const { performL2SpawnReticket } = useReticketL2Spawn();

  const [generalError, setGeneralError] = useState<Error | undefined>();
  const [progress, setProgress] = useState(0);
  const [needFunds, setNeedFunds] = useState<string | boolean | undefined>();
  const isDone = progress >= 1.0;
  const point = need.point(pointCursor);

  useBlockWindowClose();

  const goToRestart = useCallback(() => {
    reset();
    setNewWallet(Nothing());
  }, [reset, setNewWallet]);

  const loginAndGoHome = useCallback(async () => {
    // set wallet state
    resetWallet();
    setWalletType(WALLET_TYPES.TICKET);
    setUrbitWallet(Just(newWallet.value.wallet));
    // (implicit) pointCursor stays the same
    // redirect to point
    popTo(names.POINT);
  }, [
    resetWallet,
    setWalletType,
    setUrbitWallet,
    newWallet.value.wallet,
    popTo,
    names.POINT,
  ]);

  const handleUpdate: ReticketProgressCallback = useCallback(
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

  const performReticket = useCallback(async () => {
    // due to react shenanigans we may need to wait for the connector
    if (
      walletType === WALLET_TYPES.WALLET_CONNECT &&
      (!connector || !connector.connected)
    ) {
      setGeneralError(new Error('Awaiting WalletConnect connection...'));
      return;
    }

    setGeneralError(undefined);

    const l2point = await api.getPoint(point);
    const details = need.details(getDetails(point));
    const networkRevision = convertToInt(details.keyRevisionNumber, 10);

    // see also comment in useEthereumTransaction
    const txnSigner =
      walletType === WALLET_TYPES.WALLET_CONNECT ? wcSign : undefined;
    const txnSender =
      walletType === WALLET_TYPES.WALLET_CONNECT ? wcSend : undefined;

    try {
      // if L1 point with migrated spawn proxy (dominion = 'spawn')
      if (l2point.dominion === POINT_DOMINIONS.SPAWN) {
        await performL2SpawnReticket({
          fromWallet: need.wallet(wallet),
          fromWalletType: walletType,
          fromWalletHdPath: walletHdPath,
          toWallet: newWallet.value.wallet,
          to: newWallet.value.wallet.ownership.keys.address,
          point: point,
          web3: need.web3(web3),
          contracts: need.contracts(contracts),
          networkType,
          onUpdate: handleUpdate,
          nextRevision: networkRevision + 1,
          txnSigner,
          txnSender,
        });
        // If L2 point
      } else if (isL2) {
        await performL2Reticket({
          point,
          to: newWallet.value.wallet.ownership.keys.address,
          manager: newWallet.value.wallet.management.keys.address,
          toWallet: newWallet.value.wallet,
          fromWallet: need.wallet(wallet),
          onUpdate: handleUpdate,
        });
        // Fallback to L1 point flow
      } else {
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
          txnSigner,
          txnSender,
        });
      }
    } catch (err) {
      console.error(err);
      setGeneralError(err);
    }
  }, [
    api,
    connector,
    contracts,
    getDetails,
    handleUpdate,
    isL2,
    networkType,
    newWallet.value.wallet,
    performL2Reticket,
    performL2SpawnReticket,
    point,
    wallet,
    walletHdPath,
    walletType,
    wcSend,
    wcSign,
    web3,
  ]);

  useEffect(() => {
    if (!connector) {
      return;
    }

    performReticket();
    // We want to perform the reticket only once, after the WalletConnect
    // connector has finished instantiating and setting up a websocket
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector]);

  const renderAdditionalInfo = () => {
    if (generalError) {
      console.log(generalError);
      generalError.message = generalError.message || 'Something went wrong!';
      return (
        <>
          <Grid.Item full className="mt4">
            <ErrorText className={''}>
              {generalError.message.toString()}
            </ErrorText>
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
        Never give your Master Ticket to anyone
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
            Login with New Master Ticket
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
