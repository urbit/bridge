import React, { useCallback, useEffect } from 'react';
import { Grid, Text, LinkButton, H5 } from 'indigo-react';
import { Just } from 'folktale/maybe';
import { FORM_ERROR } from 'final-form';

import { useWallet } from 'store/wallet';
import { useNetwork } from 'store/network';

import { abbreviateAddress } from 'lib/utils/address';
import { WALLET_TYPES } from 'lib/constants';
import { MetamaskWallet } from 'lib/metamask';
import { getAuthToken } from 'lib/authToken';
import useLoginView from 'lib/useLoginView';
import * as need from 'lib/need';

import SubmitButton from 'form/SubmitButton';
import BridgeForm from 'form/BridgeForm';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { Row } from '@tlon/indigo-react';
import Web3 from 'web3';

export default function Metamask({ className, goHome }) {
  useLoginView(WALLET_TYPES.METAMASK);
  const { setWallet, setWalletType, setAuthToken } = useWallet();

  const { setMetamask } = useNetwork();

  useEffect(() => {
    setMetamask(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = useCallback(async () => {
    try {
      setMetamask(true);
      const accounts = await window.ethereum.send('eth_requestAccounts');
      const wallet = new MetamaskWallet(accounts.result[0]);

      const web3 = new Web3(window.ethereum);
      const authToken = await getAuthToken({
        address: wallet.address,
        walletType: WALLET_TYPES.METAMASK,
        web3,
      });

      setAuthToken(Just(authToken));
      setWallet(Just(wallet));
      setWalletType(WALLET_TYPES.METAMASK);
    } catch (e) {
      console.error(e);
      return { [FORM_ERROR]: e.message };
    }
  }, [setAuthToken, setWallet, setWalletType, setMetamask]);

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
    <Window className="master-ticket">
      <HeaderPane>
        <Row className="header-row">
          <h5>Metamask</h5>
        </Row>
      </HeaderPane>
      <BodyPane className="login-body-pane">
        <Grid.Item full as={Text} className="f6 gray4 mb3">
          If you wish to login with a different wallet, please change it in the
          Metamask extension
        </Grid.Item>
        <BridgeForm onSubmit={onSubmit} afterSubmit={goHome}>
          {({ handleSubmit }) => (
            <Grid.Item full className="flex-col justify-end w-full">
              <Grid.Item
                center
                full
                as={SubmitButton}
                handleSubmit={handleSubmit}>
                Login
                {window.ethereum.selectedAddress &&
                  ' as ' + abbreviateAddress(window.ethereum.selectedAddress)}
              </Grid.Item>
            </Grid.Item>
          )}
        </BridgeForm>
      </BodyPane>
    </Window>
  );
}
