import React, { useState } from 'react';
import { Grid, Text } from 'indigo-react';

import { useLocalRouter } from 'lib/LocalRouter';

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

import { Buffer } from 'buffer';
import { composeValidator, buildPsbtValidator } from 'form/validators';

export default function SignTransaction() {
  const { pop } = useLocalRouter();
  const { urbitWallet } = useWallet();

  const [signedTx, setSignedTx] = useState('');
  const [psbt, setPsbt] = useState({});

  const { private: privKey, chain } = need.urbitWallet(
    urbitWallet
  ).bitcoin.keys;

  const btcWallet = bitcoin.bip32.fromPrivateKey(
    Buffer.from(privKey, 'hex'),
    Buffer.from(chain, 'hex'),
    bitcoin.networks.bitcoin
  );

  const validate = composeValidator({
    unsignedTransaction: buildPsbtValidator(btcWallet),
  });

  const onSubmit = values => {
    const newPsbt = bitcoin.Psbt.fromBase64(values.unsignedTransaction);
    const hex = newPsbt.data.inputs
      .reduce((psbt, input, idx) => {
        //  removing already derived part, eg m/84'/0'/0'/0/0 becomes 0/0
        const path = input.bip32Derivation[0].path
          .split("m/84'/0'/0'/")
          .join('');
        const prv = btcWallet.derivePath(path).privateKey;
        try {
          return psbt.signInput(idx, bitcoin.ECPair.fromPrivateKey(prv));
        } catch (e) {
          return psbt;
        }
      }, newPsbt)
      .finalizeAllInputs()
      .extractTransaction()
      .toHex();

    setPsbt(newPsbt);
    setSignedTx(hex);
  };

  return (
    <View pop={pop} inset>
      <Grid className="mt4">
        <Grid.Item full className="mt4" as={Text}>
          Paste unsigned transactions from Landscape here
        </Grid.Item>
        <BridgeForm validate={validate} onSubmit={onSubmit}>
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
