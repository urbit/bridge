import React, { useState } from 'react';
import { Grid, Text } from 'indigo-react';

import { useLocalRouter } from 'lib/LocalRouter';
import { COMMANDS, useFlowCommand } from 'lib/flowCommand';

import View from 'components/View';
import Highlighted from 'components/Highlighted';
import CopiableAddressWrap from 'components/CopiableAddressWrap';
import ViewHeader from 'components/ViewHeader';
import SubmitButton from 'form/SubmitButton';

import { useWallet } from 'store/wallet';

import * as need from 'lib/need';
import * as bitcoin from 'bitcoinjs-lib';

import BridgeForm from 'form/BridgeForm';
import { PsbtInput } from 'form/Inputs';

import { composeValidator, buildPsbtValidator } from 'form/validators';

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

export default function SignTransaction() {
  const { pop } = useLocalRouter();
  const { urbitWallet } = useWallet();
  const flow = useFlowCommand();

  const [signedTx, setSignedTx] = useState('');
  const [psbt, setPsbt] = useState({});

  const { xprv: zprv } = need.urbitWallet(urbitWallet).bitcoinMainnet.keys;
  const { xprv: vprv } = need.urbitWallet(urbitWallet).bitcoinTestnet.keys;

  const validate = composeValidator({
    unsignedTransaction: buildPsbtValidator(),
  });

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
      return { unsignedTransaction: 'Cannot sign transaction, mismatching keys.' };
    }
  };

  const initialValues = {};
  if (flow && COMMANDS.BITCOIN === flow.kind) {
    initialValues.unsignedTransaction = flow.utx;
  }

  return (
    <View pop={pop} inset>
      <Grid className="mt4">
        <Grid.Item full className="mt4" as={Text}>
          Paste unsigned transactions from Landscape here
        </Grid.Item>
        <BridgeForm
          validate={validate}
          initialValues={initialValues}
          onSubmit={onSubmit}>
          {({ handleSubmit }) => (
            <>
              <Grid.Item
                full
                as={PsbtInput}
                name="unsignedTransaction"
                label="Unsigned transaction"
                className="mt4"
              />
              <Grid.Item
                full
                solid
                className="mt2"
                accessory=""
                handleSubmit={handleSubmit}
                as={SubmitButton}>
                Sign Transaction
              </Grid.Item>
            </>
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
    </View>
  );
}
