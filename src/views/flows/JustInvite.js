//NOTE  repurposed from /views/Activate/PassportTransfer,
//      with a lot of logic from /lib/useInviter

//TODO  display "you may now _close this window_" cta after calling a flow cb
//TODO  make sure we also call failure cb if we get closed prematurely

import React, { useState, useCallback } from 'react';
import { Grid, Text, ErrorText, H4 } from 'indigo-react';
import cn from 'classnames';
import ob from 'urbit-ob';
import { toBN } from 'web3-utils';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';

import * as wg from 'lib/walletgen';
import * as tank from 'lib/tank';
import { GAS_LIMITS } from 'lib/constants';
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  hexify,
} from 'lib/txn';
import useGasPrice from 'lib/useGasPrice';
import useLifecycle from 'lib/useLifecycle';
import useBlockWindowClose from 'lib/useBlockWindowClose';
import { useFlowCommand } from 'lib/flowCommand';
import { hasReceived, sendMail } from 'lib/inviteMail';
import { safeToWei } from 'lib/lib';

import LoadingBar from 'components/LoadingBar';
import { RestartButton } from 'components/Buttons';
import NeedFundsNotice from 'components/NeedFundsNotice';

import * as az from 'azimuth-js';

const labelForProgress = progress => {
  if (progress <= 0) {
    return 'Checking sanity...';
  } else if (progress <= 0.2) {
    return 'Generating invite...';
  } else if (progress <= 0.3) {
    return 'Building transaction...';
  } else if (progress <= 0.4) {
    return 'Signing transaction...';
  } else if (progress <= 0.5) {
    return 'Funding transaction...';
  } else if (progress <= 0.7) {
    return 'Sending transaction...';
  } else if (progress <= 0.9) {
    return 'Sending invite email...';
  } else {
    return 'Done';
  }
};

export default function JustInvite({ className, resetActivateRouter }) {
  const { wallet, walletType, walletHdPath, authToken } = useWallet();
  const flow = useFlowCommand();
  const { web3, contracts, networkType } = useNetwork();
  const { gasPrice } = useGasPrice();
  const [generalError, setGeneralError] = useState();
  const [progress, setProgress] = useState(0);
  const [needFunds, setNeedFunds] = useState(null);

  useBlockWindowClose();

  // useEffect(() => {
  //   switch (type) {
  //     case 'progress':
  //       return setProcesss(state);
  //     case 'askFunding':
  //       return setNeedFunds(value);
  //     case 'gotFunding':
  //       return setNeedFunds(false);
  //     default:
  //       console.error(`Unknown update: ${type}`);
  //   }
  // }, [progress]);

  const sendInvite = useCallback(async () => {
    setGeneralError(false);

    try {
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      const _wallet = wallet.getOrElse(null);
      const _authToken = authToken.getOrElse(null);
      if (!_contracts || !_web3 || !_wallet || !_authToken) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Contracts/Web3/Wallet');
      }

      const _as = ob.patp2dec(flow.as);
      const _ship = ob.patp2dec(flow.ship);
      const _email = flow.email;

      console.log('xx checking email');
      // check if email not invited before
      if (await hasReceived(_email)) {
        throw new Error(
          `This email (${_email}) has already received an invite.`
        );
      }
      setProgress(0.1);

      console.log('xx checking owner', _wallet.address, _as);
      // check if logged in with flow.as's owner
      //TODO we could move this check to the login screen
      if (!(await az.azimuth.isOwner(_contracts, _as, _wallet.address))) {
        throw new Error(`You are not logged in as ${flow.as}'s owner.'`);
      }
      setProgress(0.2);

      // generate invite code + address
      const { ticket, owner } = await wg.generateTemporaryDeterministicWallet(
        _ship,
        _authToken
      );
      setProgress(0.3);

      // generate invite tx
      const inviteTx = az.delegatedSending.sendPoint(
        _contracts,
        _as,
        _ship,
        owner.keys.address
      );
      setProgress(0.4);

      // sign invite tx
      const signedTx = await signTransaction({
        wallet: _wallet,
        walletType,
        walletHdPath,
        networkType,
        chainId: await _web3.eth.net.getId(),
        nonce: await _web3.eth.getTransactionCount(_wallet.address),
        txn: inviteTx,
        gasPrice: gasPrice.toFixed(), // expects string gwei
        gasLimit: GAS_LIMITS.GIFT_PLANET.toFixed(),
      });
      const rawTx = hexify(signedTx.serialize());
      setProgress(0.5);

      // ensure funds
      const totalCost = toBN(GAS_LIMITS.GIFT_PLANET).mul(toBN(gasPrice));
      const tankWasUsed = await tank.ensureFundsFor(
        _web3,
        _as,
        _wallet.address,
        walletType,
        safeToWei(totalCost, 'gwei'),
        [rawTx],
        (address, minBalance, balance) =>
          setNeedFunds({ address, minBalance, balance }),
        () => setNeedFunds(undefined)
      );
      setProgress(0.7);

      // send and await transaction
      const txHash = await sendSignedTransaction(_web3, signedTx, tankWasUsed);
      await waitForTransactionConfirm(_web3, txHash);
      setProgress(0.9);

      // send invite email
      //NOTE we could chuck a "pls join group-name" message in here
      await sendMail(_email, ticket, flow.as, '', rawTx);
      setProgress(1);

      flow.success();
    } catch (error) {
      // some generic error
      setGeneralError(error);
      flow.failure(error);
    }
  }, [
    wallet,
    web3,
    contracts,
    networkType,
    authToken,
    flow,
    gasPrice,
    walletHdPath,
    walletType,
  ]);

  useLifecycle(() => {
    sendInvite();
  });

  const goToRestart = useCallback(() => {
    sendInvite();
  }, [sendInvite]);

  const renderAdditionalInfo = () => {
    if (generalError) {
      console.log(generalError);
      let msg =
        typeof generalError === 'string'
          ? generalError
          : generalError.message || 'Something went wrong!';
      return (
        <>
          <Grid.Item full className="mt8">
            <ErrorText>{msg}</ErrorText>
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
        <Grid.Item full as={NeedFundsNotice} className="mt8" {...needFunds} />
      );
    }

    // if (progress < 1.0) {
    //   return (
    //     <Grid.Item full as={WarningBox} className="mt8">
    //       Never give your Master Ticket to anyone
    //     </Grid.Item>
    //   );
    // }

    return null;
  };

  return (
    <Grid className={cn(className, 'auto-rows-min')}>
      <Grid.Item full as={H4}>
        {labelForProgress(progress)}
      </Grid.Item>
      <Grid>
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
      </Grid>
    </Grid>
  );
}
