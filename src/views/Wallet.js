import Maybe from 'folktale/maybe';
import React from 'react';
import { Button, H1, P } from '../components/old/Base';
import { InnerLabelDropdown } from '../components/old/Base';

import { ROUTE_NAMES } from '../lib/routeNames';
import { withHistory } from '../store/history';
import { WALLET_TYPES, renderWalletType } from '../lib/wallet';
import { compose } from '../lib/lib';
import { withWallet } from '../store/wallet';
import View from 'components/View';

class Wallet extends React.Component {
  componentDidMount() {
    const { setWallet } = this.props;
    setWallet(Maybe.Nothing());
  }

  getWalletOptions() {
    return [
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
  }

  render() {
    const { props } = this;
    const walletOptions = this.getWalletOptions();

    return (
      <View>
        <H1>{'Unlock a Wallet'}</H1>

        <P>
          {`To manage your assets, you need to unlock a wallet.
              Please select how you would like to access your wallet.`}
        </P>

        <InnerLabelDropdown
          className={'mb-10 mt-6'}
          title={'Wallet Type:'}
          options={walletOptions}
          handleUpdate={props.setWalletType}
          currentSelectionTitle={renderWalletType(props.walletType)}
        />

        <Button
          className={'mt-10'}
          onClick={() =>
            props.history.push(
              props.walletType === WALLET_TYPES.MNEMONIC
                ? ROUTE_NAMES.MNEMONIC
                : props.walletType === WALLET_TYPES.TICKET
                ? ROUTE_NAMES.TICKET
                : props.walletType === WALLET_TYPES.SHARDS
                ? ROUTE_NAMES.SHARDS
                : props.walletType === WALLET_TYPES.LEDGER
                ? ROUTE_NAMES.LEDGER
                : props.walletType === WALLET_TYPES.TREZOR
                ? ROUTE_NAMES.TREZOR
                : props.walletType === WALLET_TYPES.PRIVATE_KEY
                ? ROUTE_NAMES.PRIVATE_KEY
                : props.walletType === WALLET_TYPES.KEYSTORE
                ? ROUTE_NAMES.KEYSTORE
                : ROUTE_NAMES.DEFAULT
            )
          }>
          {'Continue  →'}
        </Button>
      </View>
    );
  }
}

export default compose(
  withHistory,
  withWallet
)(Wallet);
