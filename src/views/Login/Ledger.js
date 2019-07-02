import React, { useState } from 'react';
import Maybe from 'folktale/maybe';
import { P, Input, Grid, H4, H5 } from 'indigo-react';
import { times } from 'lodash';
import * as bip32 from 'bip32';
import Transport from '@ledgerhq/hw-transport-u2f';
import Eth from '@ledgerhq/hw-app-eth';
import * as secp256k1 from 'secp256k1';

import { ForwardButton } from 'components/Buttons';
import { InnerLabelDropdown } from 'components/old/Base';

import { useWallet } from 'store/wallet';

import { LEDGER_LIVE_PATH, LEDGER_LEGACY_PATH } from 'lib/ledger';
import { WALLET_TYPES } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';

const pathOptions = [
  { title: 'Ledger Live', value: LEDGER_LIVE_PATH },
  { title: 'Ledger Legacy', value: LEDGER_LEGACY_PATH },
  { title: 'Custom path', value: 'custom' },
];

const accountOptions = times(20, i => ({
  title: `Account #${i + 1}`,
  value: i,
}));

const chopHdPrefix = str => (str.slice(0, 2) === 'm/' ? str.slice(2) : str);
const addHdPrefix = str => (str.slice(0, 2) === 'm/' ? str : 'm/' + str);

export default function Ledger({ className }) {
  useLoginView(WALLET_TYPES.LEDGER);

  const { setWallet, setWalletHdPath } = useWallet();

  const [basePath, setBasePath] = useState(LEDGER_LIVE_PATH);
  const [account, setAccount] = useState(0);
  const [hdPath, setHdPath] = useState(LEDGER_LIVE_PATH.replace(/x/g, 0));

  const updateHdPath = (basePath, account) => {
    if (basePath !== 'custom') {
      setHdPath(basePath.replace(/x/g, account));
    }
  };

  const handlePathSelection = basePath => {
    setBasePath(basePath);
    updateHdPath(basePath, account);
  };

  const handleAccountSelection = account => {
    setAccount(account);
    updateHdPath(basePath, account);
  };

  const pollDevice = async () => {
    const transport = await Transport.create();
    const eth = new Eth(transport);
    const path = chopHdPrefix(hdPath);

    eth.getAddress(path, false, true).then(
      info => {
        const publicKey = Buffer.from(info.publicKey, 'hex');
        const chainCode = Buffer.from(info.chainCode, 'hex');
        const pub = secp256k1.publicKeyConvert(publicKey, true);
        const hd = bip32.fromPublicKey(pub, chainCode);
        setWallet(Maybe.Just(hd));
        setWalletHdPath(addHdPrefix(hdPath));
      },
      _ => {
        setWallet(Maybe.Nothing());
      }
    );
  };

  const basePathTitle = pathOptions.find(o => o.value === basePath).title;
  const accountTitle = accountOptions.find(o => o.value === account).title;

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
      </Grid.Item>
    </>
  );

  const renderHTTPS = () => (
    <>
      <Grid.Item full as={P}>
        Connect and authenticate to your Ledger, and then open the "Ethereum"
        application. If you're running on older firmware, make sure the "browser
        support" option is turned on. To sign transactions, you'll also need to
        enable the "contract data" option.
      </Grid.Item>

      <Grid.Item full as={P}>
        If you'd like to use a custom derivation path, you may enter it below.
      </Grid.Item>

      <Grid.Item
        full
        as={InnerLabelDropdown}
        className="mv4"
        title="Derivation path"
        options={pathOptions}
        handleUpdate={handlePathSelection}
        currentSelectionTitle={basePathTitle}
      />

      {basePath === 'custom' ? (
        <Grid.Item
          full
          as={Input}
          className="mv3"
          name="hdPath"
          label="HD path"
          autoComplete="off"
          initialValue={addHdPrefix(hdPath)}
          onValue={setHdPath}
        />
      ) : (
        <Grid.Item
          full
          as={InnerLabelDropdown}
          className="mt4"
          title="Account"
          options={accountOptions}
          handleUpdate={handleAccountSelection}
          currentSelectionTitle={accountTitle}
        />
      )}

      <ForwardButton className="mt3" onClick={pollDevice}>
        Authenticate
      </ForwardButton>
    </>
  );

  return (
    <Grid className={className}>
      <Grid.Item full as={H4}>
        Authenticate With Your Ledger
      </Grid.Item>
      {isHTTPS && renderHTTPS()}
      {!isHTTPS && renderHTTP()}
    </Grid>
  );
}
