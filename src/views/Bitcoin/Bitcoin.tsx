import React, { useMemo, useState } from 'react';
import { Grid, Text } from 'indigo-react';
import { Box, Button, Row, Icon } from '@tlon/indigo-react';

import { useWallet } from 'store/wallet';

import * as bitcoin from 'bitcoinjs-lib';
import { useLocalRouter } from 'lib/LocalRouter';
import { COMMANDS, useFlowCommand } from 'lib/flowCommand';
import * as need from 'lib/need';
import useCopiable from 'lib/useCopiable';

import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader'; 
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import Highlighted from 'components/Highlighted';
import CopiableAddressWrap from 'components/copiable/CopiableAddressWrap';
import ViewHeader from 'components/ViewHeader';
import SubmitButton from 'form/SubmitButton';
import BridgeForm from 'form/BridgeForm';
import { PsbtInput } from 'form/Inputs';
import { composeValidator, buildPsbtValidator } from 'form/validators';

import './Bitcoin.scss';

const BITCOIN_MAINNET_INFO = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'bc',
  bip32: {
    public: 0x04b24746,
    private: 0x04b2430c,
  },
  pubKeyHash: 0x00,
  scriptHash: 0x05,
  wif: 0x80,
};

const BITCOIN_TESTNET_INFO = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'tb',
  bip32: {
    public: 0x045f1cf6,
    private: 0x045f18bc,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};

export default function Bitcoin() {
  const { pop }: any = useLocalRouter();
  const { urbitWallet }: any = useWallet();
  const flow = useFlowCommand();

  const [signedTx, setSignedTx] = useState('');
  const [psbt, setPsbt] = useState({});

  // set to false for BTC testnet
  const isMainnet = true;
  const { xpub: zpub } = need.urbitWallet(urbitWallet).bitcoinMainnet.keys;
  const { xpub: vpub } = need.urbitWallet(urbitWallet).bitcoinTestnet.keys;

  const { xprv: zprv } = need.urbitWallet(urbitWallet).bitcoinMainnet.keys;
  const { xprv: vprv } = need.urbitWallet(urbitWallet).bitcoinTestnet.keys;

  const validate = composeValidator({
    unsignedTransaction: buildPsbtValidator(),
  });

  const xpub = useMemo(() => (isMainnet ? zpub : vpub), [
    isMainnet,
    zpub,
    vpub,
  ]);

  const [doCopy, didCopy] = useCopiable(xpub);

  const onSubmit = values => {
    const newPsbt = bitcoin.Psbt.fromBase64(values.unsignedTransaction);

    const isTestnet = newPsbt.data.inputs[0].bip32Derivation[0].path.startsWith(
      "m/84'/1'/0'/"
    );

    const derivationPrefix = isTestnet ? "m/84'/1'/0'/" : "m/84'/0'/0'/";

    const btcWallet = isTestnet
      ? bitcoin.bip32.fromBase58(vprv, BITCOIN_TESTNET_INFO)
      : bitcoin.bip32.fromBase58(zprv, BITCOIN_MAINNET_INFO);

    try {
      const hex = newPsbt.data.inputs
        .reduce((psbt, input, idx) => {
          //  removing already derived part, eg m/84'/0'/0'/0/0 becomes 0/0
          const path = input.bip32Derivation[0].path
            .split(derivationPrefix)
            .join('');
          const prv = btcWallet.derivePath(path).privateKey;
          return psbt.signInput(idx, bitcoin.ECPair.fromPrivateKey(prv));
        }, newPsbt)
        .finalizeAllInputs()
        .extractTransaction()
        .toHex();
      setPsbt(newPsbt);
      setSignedTx(hex);
    } catch (error) {
      return {
        unsignedTransaction: 'Cannot sign transaction, mismatching keys.',
      };
    }
  };

  const initialValues = {};
  if (flow && COMMANDS.BITCOIN === flow.kind) {
    initialValues.unsignedTransaction = flow.utx;
  }

  return (
    <View
      className="bitcoin"
      pop={pop}
      inset
      header={<L2BackHeader hideBalance />}
      hideBack>
      <Window className="os-home">
        <HeaderPane>
          <Row className="header-row">
            <h5>Bitcoin</h5>
            <Button onClick={doCopy} className="copy-button">
              {didCopy ? (
                'Copied!'
              ) : (
                <>
                  <Icon icon="Copy" color="#fff" />
                  Copy Xpub
                </>
              )}
            </Button>
          </Row>
        </HeaderPane>
        <BodyPane>
          <Grid className="w-full h-full">
            <BridgeForm
              validate={validate}
              initialValues={initialValues}
              onSubmit={onSubmit}>
              {({ handleSubmit }) => (
                <Grid.Item full className="h-full flex-col justify-between">
                  <Box className="full">
                    <Box className="label full">Unsigned Transaction</Box>
                    <Grid.Item
                      full
                      placeholder="0x"
                      as={PsbtInput}
                      name="unsignedTransaction"
                      className="mt2"
                    />
                  </Box>
                  <Grid.Item
                    full
                    solid
                    center
                    className="mt2"
                    accessory=""
                    handleSubmit={handleSubmit}
                    as={SubmitButton}>
                    Sign Bitcoin Transaction
                  </Grid.Item>
                </Grid.Item>
              )}
            </BridgeForm>
            {signedTx && (
              <Grid.Item full className="mt4" as={Text}>
                Transaction outputs:
              </Grid.Item>
            )}
            {signedTx &&
              psbt.txOutputs.map(e => (
                <Grid.Item full className="mt4" key={e.address}>
                  <span>{e.address}</span>
                  <div className="mt1 mono black f6">{e.value} sats</div>
                </Grid.Item>
              ))}
            {signedTx && (
              <>
                <Grid.Item full className="mt4" as={ViewHeader}>
                  Signed transaction:
                </Grid.Item>
                <Grid.Item full as={Text}>
                  <Highlighted>
                    <CopiableAddressWrap>{signedTx}</CopiableAddressWrap>
                  </Highlighted>
                </Grid.Item>
              </>
            )}
          </Grid>
        </BodyPane>
      </Window>
    </View>
  );
}
