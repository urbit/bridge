import React, { useEffect } from 'react';
import Maybe from 'folktale/maybe';
import * as bip32 from 'bip32';
import { times } from 'lodash';
import TrezorConnect from 'trezor-connect';
import * as secp256k1 from 'secp256k1';
import { Text, Input, Grid, H5, CheckboxInput } from 'indigo-react';

import { ForwardButton } from 'components/Buttons';

import { TREZOR_PATH } from 'lib/trezor';
import { WALLET_TYPES } from 'lib/wallet';

import { useWallet } from 'store/wallet';
import useLoginView from 'lib/useLoginView';
import {
  useHdPathInput,
  useCheckboxInput,
  useSelectInput,
} from 'components/Inputs';
import SelectInput from 'indigo-react/components/SelectInput';

const ACCOUNT_OPTIONS = times(20, i => ({
  text: `Account #${i + 1}`,
  value: i,
}));

// see Ledger.js for context — Trezor is basicaly Ledger with less complexity
export default function Trezor({ className }) {
  useLoginView(WALLET_TYPES.TREZOR);

  const { setWallet, setWalletHdPath } = useWallet();

  // custom toggle
  const [customPathInput, { data: useCustomPath }] = useCheckboxInput({
    name: 'customPath',
    label: 'Custom HD Path',
    autoComplete: 'off',
    initialValue: false,
  });

  // account input
  const [accountInput, { data: accountIndex }] = useSelectInput({
    name: 'account',
    label: 'Account',
    placeholder: 'Choose account...',
    options: ACCOUNT_OPTIONS,
  });

  // hd path input
  const [
    hdPathInput,
    { data: hdPath },
    { setValue: setHdPath },
  ] = useHdPathInput({
    name: 'hdpath',
    label: 'HD Path',
    initialValue: TREZOR_PATH.replace(/x/g, 0),
  });

  const pollDevice = async () => {
    TrezorConnect.manifest({
      email: 'bridge-trezor@urbit.org',
      appUrl: 'https://github.com/urbit/bridge',
    });

    const info = await TrezorConnect.getPublicKey({
      path: hdPath,
    });

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
  };

  useEffect(() => {
    if (useCustomPath) {
      // updated by useForm
    } else {
      setHdPath(TREZOR_PATH.replace(/x/g, accountIndex));
    }
  }, [useCustomPath, setHdPath, accountIndex]);

  return (
    <Grid className={className}>
      <Grid.Item full as={H5}>
        Authenticate With Your Trezor
      </Grid.Item>

      <Grid.Item full as={Text} className="f6 mb3">
        Connect and authenticate to your Trezor. If you'd like to use a custom
        derivation path, you may enter it below.
      </Grid.Item>

      {useCustomPath && <Grid.Item full as={Input} {...hdPathInput} />}

      {!useCustomPath && <Grid.Item full as={SelectInput} {...accountInput} />}

      <Grid.Item full as={CheckboxInput} className="mv3" {...customPathInput} />

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
