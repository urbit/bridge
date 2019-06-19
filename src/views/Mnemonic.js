import React, { useCallback, useEffect, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';

import { Button } from '../components/old/Base';

import { ROUTE_NAMES } from 'lib/routeNames';
import { useHistory } from 'store/history';
import { walletFromMnemonic } from 'lib/wallet';
import { useWallet } from 'store/wallet';

import View from 'components/View';
import { MnemonicInput, PassphraseInput, HdPathInput } from 'components/Inputs';

export default function Mnemonic() {
  const history = useHistory();
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
        onSuccess={_setAuthMnemonic}
      />

      <PassphraseInput
        name="passphrase"
        label="(Optional) Wallet Passphrase"
        initialValue={passphrase}
        onSuccess={setPassphrase}
      />

      <HdPathInput
        name="hdpath"
        label="HD Path"
        initialValue={walletHdPath}
        onSuccess={setWalletHdPath}
      />

      <Button
        disabled={Nothing.hasInstance(wallet)}
        onClick={() => history.popAndPush(ROUTE_NAMES.SHIPS)}>
        {'Continue →'}
      </Button>
    </View>
  );
}
