import { Just, Nothing } from 'folktale/maybe';
import React, { useEffect } from 'react';
import { Grid, Input } from 'indigo-react';

import { usePassphraseInput } from 'components/Inputs';

import { useWallet } from 'store/wallet';

import { EthereumWallet, WALLET_TYPES } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';

export default function PrivateKey({ className }) {
  useLoginView(WALLET_TYPES.PRIVATE_KEY);

  const { setWallet } = useWallet();

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
    <Grid className={className}>
      <Grid.Item full as={Input} {...privateKeyInput} />
    </Grid>
  );
}
