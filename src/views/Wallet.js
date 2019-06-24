import React from 'react';
import Maybe from 'folktale/maybe';

import { H1, P } from '../components/old/Base';
import { InnerLabelDropdown } from '../components/old/Base';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';

import { useHistory } from '../store/history';
import { useWallet } from '../store/wallet';

import { ROUTE_NAMES } from '../lib/routeNames';
import { WALLET_TYPES, renderWalletType } from '../lib/wallet';
import useLifecycle from 'lib/useLifecycle';

const kWalletOptions = [
  {
    title: 'Urbit Master Ticket',
    value: WALLET_TYPES.TICKET,
  },
  {
    title: 'Urbit Master Ticket (Shards)',
    value: WALLET_TYPES.SHARDS,
  },
  {
    type: 'divider',
  },
  {
    title: 'Ledger',
    value: WALLET_TYPES.LEDGER,
  },
  {
    title: 'Trezor',
    value: WALLET_TYPES.TREZOR,
  },
  {
    type: 'divider',
  },
  {
    title: 'BIP39 Mnemonic',
    value: WALLET_TYPES.MNEMONIC,
  },
  {
    title: 'Ethereum Private Key',
    value: WALLET_TYPES.PRIVATE_KEY,
  },
  {
    title: 'Ethereum Keystore File',
    value: WALLET_TYPES.KEYSTORE,
  },
];

export default function Wallet() {
  const history = useHistory();
  const { setWallet, walletType, setWalletType } = useWallet();

  // reset wallet when this component is mounted
  useLifecycle(() => setWallet(Maybe.Nothing()));

  return (
    <View>
      <H1>Unlock a Wallet</H1>

      <P>
        To manage your assets, you need to unlock a wallet. Please select how
        you would like to access your wallet.
      </P>

      <InnerLabelDropdown
        title="Wallet Type:"
        options={kWalletOptions}
        handleUpdate={setWalletType}
        currentSelectionTitle={renderWalletType(walletType)}
      />

      <ForwardButton
        onClick={() =>
          history.push(
            walletType === WALLET_TYPES.MNEMONIC
              ? ROUTE_NAMES.MNEMONIC
              : walletType === WALLET_TYPES.TICKET
              ? ROUTE_NAMES.TICKET
              : walletType === WALLET_TYPES.SHARDS
              ? ROUTE_NAMES.SHARDS
              : walletType === WALLET_TYPES.LEDGER
              ? ROUTE_NAMES.LEDGER
              : walletType === WALLET_TYPES.TREZOR
              ? ROUTE_NAMES.TREZOR
              : walletType === WALLET_TYPES.PRIVATE_KEY
              ? ROUTE_NAMES.PRIVATE_KEY
              : walletType === WALLET_TYPES.KEYSTORE
              ? ROUTE_NAMES.KEYSTORE
              : ROUTE_NAMES.DEFAULT
          )
        }>
        Continue
      </ForwardButton>
    </View>
  );
}
