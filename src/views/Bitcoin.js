import React, { useState } from 'react';
import { Grid, Text } from 'indigo-react';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import { useLocalRouter } from 'lib/LocalRouter';

import ViewHeader from 'components/ViewHeader';
import View from 'components/View';
import WarningBox from 'components/WarningBox';

import CopiableAddressWrap from 'components/CopiableAddressWrap';
import Highlighted from 'components/Highlighted';

import { PsbtInput } from 'form/Inputs';
import BridgeForm from 'form/BridgeForm';

import * as need from 'lib/need';
import * as bitcoin from 'bitcoinjs-lib';
import * as bs58check from 'bs58check';
import ob from 'urbit-ob';
import { Buffer } from 'buffer';
import { composeValidator, buildPsbtValidator } from 'form/validators';

function xpubToZpub(xpub) {
  var data = bs58check.decode(xpub);
  data = data.slice(4);
  data = Buffer.concat([Buffer.from('04b24746', 'hex'), data]);
  return bs58check.encode(data);
}

export default function Bitcoin() {
  const { pop } = useLocalRouter();
  const { urbitWallet } = useWallet();
  const { pointCursor } = usePointCursor();


  const empty = new bitcoin.Psbt();

  const [signedTx, setSignedTx] = useState('');
  const [psbt, setPsbt] = useState(empty);

  const pointName = ob.patp(need.point(pointCursor));

  const privKey = need.urbitWallet(urbitWallet).bitcoin.keys.private;
  const pubKey = need.urbitWallet(urbitWallet).bitcoin.keys.public;
  const chain = need.urbitWallet(urbitWallet).bitcoin.keys.chain;

  const hd = bitcoin.bip32.fromPrivateKey(
    Buffer.from(privKey, 'hex'),
    Buffer.from(chain, 'hex'),
    bitcoin.networks.bitcoin
  );

  const zPub = xpubToZpub(
    bitcoin.bip32
      .fromPublicKey(
        Buffer.from(pubKey, 'hex'),
        Buffer.from(chain, 'hex'),
        bitcoin.networks.bitcoin
      )
      .toBase58()
  );

  const validate = composeValidator({
    unsignedTransaction: buildPsbtValidator(hd),
  });

  const onValues = ({ valid, values, form }) => {
    if (valid) {
      const newPsbt = bitcoin.Psbt.fromBase64(values.unsignedTransaction);
      const hex = newPsbt.data.inputs
        .reduce((psbt, input, idx) => {
          //  removing already derived part, eg m/84'/0'/0'/0/0 becomes 0/0
          const path = input.bip32Derivation[0].path.substring(12);
          const prv = hd.derivePath(path).privateKey;
          try {
            return psbt.signInput(idx, bitcoin.ECPair.fromPrivateKey(prv));
          } catch (e) {
            return psbt;
          }
        }, newPsbt)
        .finalizeAllInputs()
        .extractTransaction()
        .toHex();

      if (psbt.toHex() !== newPsbt.toHex()) {
        setPsbt(newPsbt);
      }
      setSignedTx(hex);
    } else {
      setSignedTx('');
    }
  };

  return (
    <View pop={pop} inset>
      <Grid className="mt4">
        <Grid.Item full as={ViewHeader}>
          Bitcoin
        </Grid.Item>
        <Grid.Item full as={WarningBox}>
          We do not recommend using this feature for significant amounts of
          money, since your private keys are exposed to the browser.
        </Grid.Item>
        <Grid.Item full className="mt4" as={Text}>
          Below is the bitcoin extended public key derived from your point
          {' ' + pointName}. You can paste it to Landscape to generate an
          unsigned transaction.
        </Grid.Item>
        <Grid.Item full className="mt4" as={Text}>
          <Highlighted>
            <CopiableAddressWrap>{zPub}</CopiableAddressWrap>
          </Highlighted>
        </Grid.Item>
        <Grid.Item full className="mt4" as={Text}>
          Next, paste the unsigned transaction below to sign it with your
          private key.
        </Grid.Item>
        <BridgeForm validate={validate} onValues={onValues}>
          {() => (
            <Grid.Item
              full
              as={PsbtInput}
              name="unsignedTransaction"
              label="Unsigned transaction"
              className="mt4"
            />
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
              <div className="mt1 mono black f6">{e.value} Satoshis</div>
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
