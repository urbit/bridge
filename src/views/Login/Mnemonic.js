import React, { useCallback, useEffect } from 'react';
import { Just, Nothing } from 'folktale/maybe';
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
    authMnemonic,
    setAuthMnemonic,
    walletHdPath,
    setWalletHdPath,
  } = useWallet();

  const advancedInput = useCheckboxInput({
    name: 'advanced',
    label: 'Passphrase & HD Path',
    initialValue: false,
  });
  const mnemonic = authMnemonic.getOrElse('');
  // TODO: move this into transformers?
  // transform the result of the mnemonic to Maybe<string>
  const _setAuthMnemonic = useCallback(
    mnemonic => setAuthMnemonic(mnemonic === '' ? Nothing() : Just(mnemonic)),
    [setAuthMnemonic]
  );

  const mnemonicInput = useMnemonicInput({
    name: 'mnemonic',
    label: 'BIP39 Mnemonic',
    initialValue: mnemonic,
    onValue: _setAuthMnemonic,
    autoFocus: true,
  });

  const passphraseInput = usePassphraseInput({
    name: 'passphrase',
    label: '(Optional) Wallet Passphrase',
  });
  const passphrase = passphraseInput.data;

  const hdPathInput = useHdPathInput({
    name: 'hdpath',
    label: 'HD Path',
    initialValue: walletHdPath,
    onValue: setWalletHdPath,
  });

  // when the properties change, re-derive wallet
  useEffect(() => {
    let mounted = true;
    (async () => {
      const wallet = walletFromMnemonic(mnemonic, walletHdPath, passphrase);
      mounted && setWallet(wallet);
    })();
    return () => (mounted = false);
  }, [mnemonic, passphrase, walletHdPath, setWallet]);

  return (
    <Grid className={className}>
      <Grid.Item full as={Input} {...mnemonicInput} />

      {advancedInput.data && (
        <>
          <Grid.Item full as={Input} {...passphraseInput} />
          <Grid.Item full as={Input} {...hdPathInput} />
        </>
      )}

      <Grid.Item as={CheckboxInput} {...advancedInput} full />
    </Grid>
  );
}
