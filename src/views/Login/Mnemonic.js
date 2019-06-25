import React, { useCallback, useEffect, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';

import View from 'components/View';
import { MnemonicInput, PassphraseInput, HdPathInput } from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';

import { walletFromMnemonic } from 'lib/wallet';
import { useWallet } from 'store/wallet';

export default function Mnemonic({ advanced, loginCompleted }) {
  const {
    wallet,
    setWallet,
    authMnemonic,
    setAuthMnemonic,
    walletHdPath,
    setWalletHdPath,
  } = useWallet();
  const [passphrase, setPassphrase] = useState('');
  const mnemonic = authMnemonic.getOrElse('');

  // TODO: move this into transformers?
  // transform the result of the mnemonic to Maybe<string>
  const _setAuthMnemonic = useCallback(
    mnemonic => setAuthMnemonic(mnemonic === '' ? Nothing() : Just(mnemonic)),
    [setAuthMnemonic]
  );

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
      <MnemonicInput
        name="mnemonic"
        label="BIP39 Mnemonic"
        initialValue={mnemonic}
        onValue={_setAuthMnemonic}
        autoFocus
      />

      {!advanced ? null : (
        <>
          <PassphraseInput
            name="passphrase"
            label="(Optional) Wallet Passphrase"
            initialValue={passphrase}
            onValue={setPassphrase}
          />

          <HdPathInput
            name="hdpath"
            label="HD Path"
            initialValue={walletHdPath}
            onValue={setWalletHdPath}
          />
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
