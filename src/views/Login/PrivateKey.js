import { Just, Nothing } from 'folktale/maybe';
import React, { useEffect } from 'react';

import View from 'components/View';
import { usePassphraseInput } from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';

import { EthereumWallet } from 'lib/wallet';
import { useWallet } from 'store/wallet';
import { Input } from 'indigo-react';

export default function PrivateKey({ loginCompleted }) {
  const { wallet, setWallet } = useWallet();

  const privateKeyInput = usePassphraseInput({
    name: 'privateKey',
    label: 'Private key',
    autoFocus: true,
  });
  const privateKey = privateKeyInput.data;

  useEffect(() => {
    if (/^[0-9A-Fa-f]{64}$/g.test(privateKey) === true) {
      const sec = Buffer.from(privateKey, 'hex');
      const newWallet = new EthereumWallet(sec);
      setWallet(Just(newWallet));
    } else {
      setWallet(Nothing());
    }
  }, [privateKey, setWallet]);

  return (
    <View>
      Please enter your raw Ethereum private key here.
      <Input {...privateKeyInput} />
      <ForwardButton
        className="mt3"
        disabled={Nothing.hasInstance(wallet)}
        onClick={loginCompleted}>
        Continue
      </ForwardButton>
    </View>
  );
}
