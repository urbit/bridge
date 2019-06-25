import * as bip32 from 'bip32';
import React, { useState } from 'react';
import Maybe from 'folktale/maybe';
import { times } from 'lodash';
import TrezorConnect from 'trezor-connect';
import * as secp256k1 from 'secp256k1';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import { H1, P, Input } from 'indigo-react';
import { InnerLabel, InnerLabelDropdown } from 'components/old/Base';

import { TREZOR_PATH } from 'lib/trezor';
import { useWallet } from 'store/wallet';

const accountOptions = [
  { title: 'Custom path', value: 'custom' },
  ...times(20, i => ({ title: `Account #${i + 1}`, value: i })),
];

export default function Trezor({ loginCompleted }) {
  const { wallet, setWallet, setWalletHdPath } = useWallet();

  const [hdPath, setHdPath] = useState(TREZOR_PATH.replace(/x/g, 0));
  const [account, setAccount] = useState(0);

  const handleAccountSelection = account => {
    setAccount(account);
    if (account !== 'custom') {
      setHdPath(TREZOR_PATH.replace(/x/g, account));
    }
  };

  const pollDevice = async () => {
    TrezorConnect.manifest({
      email: 'bridge-trezor@urbit.org',
      appUrl: 'https://github.com/urbit/bridge',
    });
    TrezorConnect.getPublicKey({ path: hdPath }).then(info => {
      if (info.success === true) {
        const payload = info.payload;
        const publicKey = Buffer.from(payload.publicKey, 'hex');
        const chainCode = Buffer.from(payload.chainCode, 'hex');
        const pub = secp256k1.publicKeyConvert(publicKey, true);
        const hd = bip32.fromPublicKey(pub, chainCode);
        setWallet(Maybe.Just(hd));
        setWalletHdPath(hdPath);
      } else {
        setWallet(Maybe.Nothing());
      }
    });
  };

  let accountTitle = accountOptions.find(o => o.value === account).title;

  const accountSelection = (
    <InnerLabelDropdown
      className="mt-8"
      prop-size="md"
      prop-format="innerLabel"
      options={accountOptions}
      handleUpdate={handleAccountSelection}
      title="Account"
      currentSelectionTitle={accountTitle}
      fullWidth={true}
    />
  );

  const pathSelection =
    account !== 'custom' ? null : (
      <Input
        className="mt3"
        name="hdPath"
        label="HD path"
        autocomplete="off"
        initialValue={hdPath}
        onValue={setHdPath}
      />
    );

  return (
    <View>
      <H1>Authenticate With Your Trezor</H1>

      <P>
        Connect and authenticate to your Trezor. If you'd like to use a custom
        derivation path, you may enter it below.
      </P>

      {accountSelection}
      {pathSelection}

      <ForwardButton className="mt3" onClick={pollDevice}>
        Authenticate
      </ForwardButton>

      <ForwardButton
        className="mt3"
        disabled={Maybe.Nothing.hasInstance(wallet)}
        onClick={loginCompleted}>
        Continue
      </ForwardButton>
    </View>
  );
}
