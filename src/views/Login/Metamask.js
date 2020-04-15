import React, { useCallback } from 'react';
import { Grid, Text, LinkButton, H5 } from 'indigo-react';
import { Just } from 'folktale/maybe';
import { FORM_ERROR } from 'final-form';

import { useWallet } from 'store/wallet';
import { useNetwork } from 'store/network';

import { WALLET_TYPES, abbreviateAddress } from 'lib/wallet';
import { MetamaskWallet } from 'lib/metamask';
import { getAuthToken } from 'lib/authToken';
import useLoginView from 'lib/useLoginView';
import * as need from 'lib/need';

import SubmitButton from 'form/SubmitButton';
import BridgeForm from 'form/BridgeForm';

export default function Metamask({ className, goHome }) {
  useLoginView(WALLET_TYPES.METAMASK);
  const { setWallet, setWalletType, setAuthToken } = useWallet();

  const { web3 } = useNetwork();
  const _web3 = need.web3(web3);

  const onSubmit = useCallback(async () => {
    try {
      const accounts = await window.ethereum.enable();
      const wallet = new MetamaskWallet(accounts[0]);

      const authToken = await getAuthToken({
        wallet,
        walletType: WALLET_TYPES.METAMASK,
        web3: _web3,
      });

      setAuthToken(authToken);
      setWallet(Just(wallet));
      setWalletType(WALLET_TYPES.METAMASK);
    } catch (e) {
      console.error(e);
      return { [FORM_ERROR]: e.message };
    }
  }, [_web3, setAuthToken, setWallet, setWalletType]);

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
              ' as ' + abbreviateAddress(window.ethereum.selectedAddress)}
          </Grid.Item>
        )}
      </BridgeForm>
    </>
  );
}
