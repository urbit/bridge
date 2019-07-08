import React, { useCallback, useEffect } from 'react';
import Maybe from 'folktale/maybe';
import { P, Text, Input, Grid, H5, CheckboxInput } from 'indigo-react';
import { times } from 'lodash';
import * as bip32 from 'bip32';
import Transport from '@ledgerhq/hw-transport-u2f';
import Eth from '@ledgerhq/hw-app-eth';
import * as secp256k1 from 'secp256k1';

import { ForwardButton } from 'components/Buttons';
import {
  useCheckboxInput,
  useHdPathInput,
  useSelectInput,
} from 'components/Inputs';

import { useWallet } from 'store/wallet';

import {
  LEDGER_LIVE_PATH,
  LEDGER_LEGACY_PATH,
  chopHdPrefix,
  addHdPrefix,
} from 'lib/ledger';
import { WALLET_TYPES } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';
import SelectInput from 'indigo-react/components/SelectInput';
import useBreakpoints from 'lib/useBreakpoints';

const PATH_OPTIONS = [
  { text: 'Ledger Live', value: LEDGER_LIVE_PATH },
  { text: 'Ledger Legacy', value: LEDGER_LEGACY_PATH },
];

const ACCOUNT_OPTIONS = times(20, i => ({
  text: `Account #${i + 1}`,
  value: i,
}));

export default function Ledger({ className }) {
  useLoginView(WALLET_TYPES.LEDGER);

  const { setWallet, setWalletHdPath } = useWallet();

  // derivation path input
  const [derivationPathInput, { data: basePathPattern }] = useSelectInput({
    name: 'derivationpath',
    label: 'Derivation Path',
    placeholder: 'Choose path pattern...',
    options: PATH_OPTIONS,
  });

  // account input
  const [accountInput, { data: accountIndex }] = useSelectInput({
    name: 'account',
    label: 'Account',
    placeholder: 'Choose account...',
    options: ACCOUNT_OPTIONS,
  });

  // custom toggle
  const [customPathInput, { data: useCustomPath }] = useCheckboxInput({
    name: 'customPath',
    label: 'Custom HD Path',
    autoComplete: 'off',
    initialValue: false,
  });

  // hd path input
  const [
    hdPathInput,
    { data: hdPath },
    { setValue: setHdPath },
  ] = useHdPathInput({
    name: 'hdpath',
    label: 'HD Path',
    initialValue: basePathPattern.replace(/x/g, 0),
  });

  const pollDevice = useCallback(async () => {
    const transport = await Transport.create();
    const eth = new Eth(transport);
    const path = chopHdPrefix(hdPath);

    try {
      const info = await eth.getAddress(path, false, true);
      const publicKey = Buffer.from(info.publicKey, 'hex');
      const chainCode = Buffer.from(info.chainCode, 'hex');
      const pub = secp256k1.publicKeyConvert(publicKey, true);
      const hd = bip32.fromPublicKey(pub, chainCode);
      setWallet(Maybe.Just(hd));
      setWalletHdPath(addHdPrefix(hdPath));
    } catch (error) {
      console.error(error);
      setWallet(Maybe.Nothing());
    }
  }, [hdPath, setWallet, setWalletHdPath]);

  // when the base path pattern or the account index changes
  // update the hd path in our input
  useEffect(() => {
    if (useCustomPath) {
      // updated by useForm
    } else {
      setHdPath(basePathPattern.replace(/x/g, accountIndex));
    }
  }, [useCustomPath, setHdPath, basePathPattern, accountIndex]);

  const full = useBreakpoints([true, true, false]);
  const half = useBreakpoints([false, false, true]);
  const isHTTPS = document.location.protocol === 'https:';

  // when not on https, tell user how to get there
  const renderHTTP = () => (
    <>
      <Grid.Item full as={H5}>
        Running on HTTP?
      </Grid.Item>

      <Grid.Item full as={P}>
        To authenticate and sign transactions with a Ledger, Bridge must be
        serving over HTTPS on localhost. You can do this via the following:
      </Grid.Item>

      <Grid.Item full as="ol">
        <li>
          Install{' '}
          <a
            target="_blank"
            href="https://github.com/FiloSottile/mkcert"
            rel="noopener noreferrer">
            mkcert
          </a>
        </li>
        <li className="mt3">
          Install a local certificate authority via <code>mkcert -install</code>
        </li>
        <li className="mt3">
          In your <code>bridge</code> directory, generate a certificate valid
          for localhost via <code>mkcert localhost</code>. This will produce two
          files: <code>localhost.pem</code>, the local certificate, and
          <code>localhost-key.pem</code> , its corresponding private key.
        </li>
        <li className="mt3">
          Run <code>python bridge-https.py</code>
        </li>
        <li className="mt3">Return to this page.</li>
      </Grid.Item>
    </>
  );

  const renderHTTPS = () => (
    <>
      <Grid.Item full as={H5}>
        Authenticate With Your Ledger
      </Grid.Item>
      <Grid.Item full as={Text} className="f6 mb3">
        Connect and authenticate to your Ledger, and then open the "Ethereum"
        application. If you're running on older firmware, make sure the "browser
        support" option is turned on. To sign transactions, you'll also need to
        enable the "contract data" option.
      </Grid.Item>

      {useCustomPath && <Grid.Item full as={Input} {...hdPathInput} />}

      {!useCustomPath && (
        <>
          <Grid.Item
            full={full}
            half={half && 1}
            as={SelectInput}
            className="pr1"
            {...derivationPathInput}
          />
          <Grid.Item
            full={full}
            half={half && 2}
            as={SelectInput}
            className="pl1"
            {...accountInput}
          />
        </>
      )}

      <Grid.Item full as={CheckboxInput} className="mv3" {...customPathInput} />

      <Grid.Item
        full
        as={ForwardButton}
        solid
        className="mt3"
        onClick={pollDevice}>
        Authenticate
      </Grid.Item>
    </>
  );

  return (
    <Grid className={className}>
      {isHTTPS && renderHTTPS()}
      {!isHTTPS && renderHTTP()}
    </Grid>
  );
}
