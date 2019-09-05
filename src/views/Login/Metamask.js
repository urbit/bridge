import React, { useCallback } from 'react';
import cn from 'classnames';
import { Grid, Text, LinkButton, H5 } from 'indigo-react';
import { Just } from 'folktale/maybe';

import { useWallet } from 'store/wallet';

import { WALLET_TYPES } from 'lib/wallet';
import { MetamaskWallet } from 'lib/metamask';

import SubmitButton from 'form/SubmitButton';
import BridgeForm from 'form/BridgeForm';

export default function Metamask({ className, goHome }) {
  const { setWallet, setWalletType } = useWallet();

  const onSubmit = useCallback(async () => {
    const accounts = await window.ethereum.enable();
    const wallet = new MetamaskWallet(accounts[0]);
    setWallet(Just(wallet));
    setWalletType(WALLET_TYPES.METAMASK);
  }, [setWallet]);

  const login = () => (
    <>
      <Grid.Item full as={H5}>
        Authenticate with Metamask
      </Grid.Item>
      <Grid.Item full as={Text} className="f6 mb3">
        If you wish to login with a different wallet, please change it in the
        Metamask extension
      </Grid.Item>
      <BridgeForm onSubmit={onSubmit} afterSubmit={goHome}>
        {({ handleSubmit }) => (
          <Grid.Item full as={SubmitButton} handleSubmit={handleSubmit}>
            Login
            {window.ethereum.selectedAddress &&
              ' as ' + window.ethereum.selectedAddress}
          </Grid.Item>
        )}
      </BridgeForm>
    </>
  );
  return (
    <Grid className={cn('mt4', className)}>
      {(window.ethereum && login()) || MetamaskUnsupported()}
    </Grid>
  );
}

function MetamaskUnsupported() {
  return (
    <>
      <Grid.Item full as={H5}>
        Metamask unsupported
      </Grid.Item>
      <Grid.Item full as={Text} className="f6 mb3">
        Metamask is not installed on this browser.
        <LinkButton href="https://metamask.io" as={LinkButton}>
          Get Metamask
        </LinkButton>
      </Grid.Item>
    </>
  );
}
