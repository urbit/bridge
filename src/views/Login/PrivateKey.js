import { Just, Nothing } from 'folktale/maybe';
import React, { useState } from 'react';

import View from '../../components/View';
import { PassphraseInput } from '../../components/Inputs';
import { ForwardButton } from '../../components/Buttons';

import { EthereumWallet } from '../../lib/wallet';
import { useWallet } from '../../store/wallet';

export default function PrivateKey({ loginCompleted }) {
  const { wallet, setWallet } = useWallet();

  const [privateKey, setPrivateKey] = useState('');

  const handlePrivateKeyInput = privateKey => {
    setPrivateKey(privateKey);
    constructWallet(privateKey);
  };

  const constructWallet = privateKey => {
    if (/^[0-9A-Fa-f]{64}$/g.test(privateKey) === true) {
      const sec = Buffer.from(privateKey, 'hex');
      const newWallet = new EthereumWallet(sec);
      setWallet(Just(newWallet));
    } else {
      setWallet(Nothing());
    }
  };

  return (
    <View>
      Please enter your raw Ethereum private key here.
      <PassphraseInput
        type="password"
        name="privateKey"
        label="Private key"
        initialValue={privateKey}
        onValue={handlePrivateKeyInput}
        autocomplete="off"
        autoFocus></PassphraseInput>
      <ForwardButton
        className={'mt3'}
        disabled={Nothing.hasInstance(wallet)}
        onClick={loginCompleted}>
        {'Continue →'}
      </ForwardButton>
    </View>
  );
}
