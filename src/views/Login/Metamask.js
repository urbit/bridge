import React, { useCallback } from 'react';
import { Grid, Text, LinkButton, H5 } from 'indigo-react';
import { Just } from 'folktale/maybe';

import { useWallet } from 'store/wallet';

import { WALLET_TYPES } from 'lib/wallet';
import { MetamaskWallet } from 'lib/metamask';
import useLoginView from 'lib/useLoginView';

import SubmitButton from 'form/SubmitButton';
import BridgeForm from 'form/BridgeForm';

export default function Metamask({ className, goHome }) {
  useLoginView(WALLET_TYPES.METAMASK);
  const { setWallet, setWalletType } = useWallet();

  const onSubmit = useCallback(async () => {
    const accounts = await window.ethereum.enable();
    const wallet = new MetamaskWallet(accounts[0]);
    setWallet(Just(wallet));
    setWalletType(WALLET_TYPES.METAMASK);
  }, [setWallet, setWalletType]);

  return (
    <Grid className={className}>
      {(window.ethereum && Login({ onSubmit, goHome })) || Unsupported()}
    </Grid>
  );
}

function Unsupported() {
  return (
    <>
      <Grid.Item full as={H5}>
        Unsupported
      </Grid.Item>
      <Grid.Item full as={Text} className="f6 mb3">
        Metamask is not installed on this browser. <br />
        <LinkButton href="https://metamask.io" as={LinkButton}>
          Get Metamask
        </LinkButton>
      </Grid.Item>
    </>
  );
}
function Login({ onSubmit, goHome }) {
  return (
    <>
      <Grid.Item full as={Text} className="f6 gray4 mb3">
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
}
