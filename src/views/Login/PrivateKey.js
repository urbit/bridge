import React, { useEffect } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, Input } from 'indigo-react';

import { useHexInput } from 'components/Inputs';

import { useWallet } from 'store/wallet';

import { EthereumWallet, WALLET_TYPES, stripHexPrefix } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';

export default function PrivateKey({ className }) {
  useLoginView(WALLET_TYPES.PRIVATE_KEY);

  const { setWallet } = useWallet();

  const [privateKeyInput, { pass, data: privateKey }] = useHexInput({
    length: 64,
    name: 'privateKey',
    label: 'Private key',
    autoFocus: true,
  });

  useEffect(() => {
    if (pass) {
      const sec = Buffer.from(stripHexPrefix(privateKey), 'hex');
      const newWallet = new EthereumWallet(sec);
      setWallet(Just(newWallet));
    } else {
      setWallet(Nothing());
    }
  }, [pass, privateKey, setWallet]);

  return (
    <Grid className={className}>
      <Grid.Item full as={Input} {...privateKeyInput} />
    </Grid>
  );
}
