import React, { useEffect } from 'react';
import Maybe from 'folktale/maybe';
import { Grid, Input, CheckboxInput } from 'indigo-react';

import {
  usePassphraseInput,
  useMnemonicInput,
  useHdPathInput,
  useCheckboxInput,
} from 'components/Inputs';

import { useWallet } from 'store/wallet';

import { walletFromMnemonic, WALLET_TYPES } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';

export default function Mnemonic({ className }) {
  useLoginView(WALLET_TYPES.MNEMONIC);

  const {
    setWallet,
    setAuthMnemonic,
    walletHdPath,
    setWalletHdPath,
  } = useWallet();

  const [advancedInput, { data: useAdvanced }] = useCheckboxInput({
    name: 'advanced',
    label: 'Passphrase & HD Path',
    initialValue: false,
  });

  const [mnemonicInput, { pass, data: mnemonic }] = useMnemonicInput({
    name: 'mnemonic',
    label: 'BIP39 Mnemonic',
    autoFocus: true,
  });

  const [passphraseInput, { data: passphrase }] = usePassphraseInput({
    name: 'passphrase',
    label: 'Wallet Passphrase',
  });

  const [hdPathInput, { data: hdPath }] = useHdPathInput({
    name: 'hdpath',
    label: 'HD Path',
    initialValue: walletHdPath,
  });

  // when the properties change, re-derive wallet and set global state
  useEffect(() => {
    if (pass) {
      setWalletHdPath(hdPath);
      setAuthMnemonic(Maybe.Just(mnemonic));
      setWallet(walletFromMnemonic(mnemonic, hdPath, passphrase));
    } else {
      setAuthMnemonic(Maybe.Nothing());
      setWallet(Maybe.Nothing());
    }
  }, [
    pass,
    mnemonic,
    passphrase,
    hdPath,
    setWallet,
    setAuthMnemonic,
    setWalletHdPath,
  ]);

  return (
    <Grid className={className}>
      <Grid.Item full as={Input} {...mnemonicInput} />

      {useAdvanced && (
        <>
          <Grid.Item full as={Input} {...passphraseInput} />
          <Grid.Item full as={Input} {...hdPathInput} />
        </>
      )}

      <Grid.Item as={CheckboxInput} {...advancedInput} full />
    </Grid>
  );
}
