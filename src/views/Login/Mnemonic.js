import React, { useCallback, useEffect } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Input } from 'indigo-react';

import View from 'components/View';
import {
  usePassphraseInput,
  useMnemonicInput,
  useHdPathInput,
} from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';

import { useWallet } from 'store/wallet';

import { walletFromMnemonic, WALLET_TYPES } from 'lib/wallet';
import useWalletType from 'lib/useWalletType';

export default function Mnemonic({ advanced, loginCompleted }) {
  useWalletType(WALLET_TYPES.MNEMONIC);
  const {
    wallet,
    setWallet,
    authMnemonic,
    setAuthMnemonic,
    walletHdPath,
    setWalletHdPath,
  } = useWallet();

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
    <View>
      <Input {...mnemonicInput} />

      {!advanced ? null : (
        <>
          <Input {...passphraseInput} />

          <Input {...hdPathInput} />
        </>
      )}

      <ForwardButton
        className="mt3"
        disabled={Nothing.hasInstance(wallet)}
        onClick={loginCompleted}
        solid>
        Continue
      </ForwardButton>
    </View>
  );
}
