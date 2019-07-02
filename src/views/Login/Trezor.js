import * as bip32 from 'bip32';
import React, { useState } from 'react';
import Maybe from 'folktale/maybe';
import { times } from 'lodash';
import TrezorConnect from 'trezor-connect';
import * as secp256k1 from 'secp256k1';
import { P, Input, Grid, H5 } from 'indigo-react';

import { ForwardButton } from 'components/Buttons';
import { InnerLabelDropdown } from 'components/old/Base';

import { TREZOR_PATH } from 'lib/trezor';
import { WALLET_TYPES } from 'lib/wallet';

import { useWallet } from 'store/wallet';
import useLoginView from 'lib/useLoginView';

const accountOptions = [
  { title: 'Custom path', value: 'custom' },
  ...times(20, i => ({ title: `Account #${i + 1}`, value: i })),
];

export default function Trezor({ className }) {
  useLoginView(WALLET_TYPES.TREZOR);

  const { setWallet, setWalletHdPath } = useWallet();

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

  const accountTitle = accountOptions.find(o => o.value === account).title;

  return (
    <Grid className={className}>
      <Grid.Item full as={H5}>
        Authenticate With Your Trezor
      </Grid.Item>

      <Grid.Item full as={P}>
        Connect and authenticate to your Trezor. If you'd like to use a custom
        derivation path, you may enter it below.
      </Grid.Item>

      <Grid.Item
        full
        as={InnerLabelDropdown}
        className="mv4"
        title="Account"
        options={accountOptions}
        handleUpdate={handleAccountSelection}
        currentSelectionTitle={accountTitle}
      />

      {account === 'custom' && (
        <Grid.Item
          full
          as={Input}
          className="mv4"
          name="hdPath"
          label="HD path"
          autoComplete="off"
          initialValue={hdPath}
          onValue={setHdPath}
        />
      )}

      <Grid.Item
        full
        as={ForwardButton}
        solid
        className="mt3"
        onClick={pollDevice}>
        Authenticate
      </Grid.Item>
    </Grid>
  );
}
