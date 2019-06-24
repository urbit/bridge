import React from 'react';
import { P, InnerLabelDropdown } from '../../components/old/Base';
import { Row, Col } from '../../components/old/Base';

import Ticket from './Ticket';
import Shards from './Shards';
import Ledger from './Ledger';
import Trezor from './Trezor';
import Mnemonic from './Mnemonic';
import PrivateKey from './PrivateKey';
import Keystore from './Keystore';

import { WALLET_TYPES, renderWalletType } from '../../lib/wallet';
import { compose } from '../../lib/lib';
import { withWallet } from '../../store/wallet';

class Advanced extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: WALLET_TYPES.TICKET,
    };

    this.handleSelection = this.handleSelection.bind(this);
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

  handleSelection(selected) {
    this.setState({ selected });
  }

  render() {
    const loginCompleted = this.props.loginCompleted;
    const inputs = (() => {
      switch (this.state.selected) {
        case WALLET_TYPES.TICKET:
          return <Ticket advanced={true} loginCompleted={loginCompleted} />;
        case WALLET_TYPES.SHARDS:
          return <Shards loginCompleted={loginCompleted} />;
        //
        case WALLET_TYPES.LEDGER:
          return <Ledger loginCompleted={loginCompleted} />;
        case WALLET_TYPES.TREZOR:
          return <Trezor loginCompleted={loginCompleted} />;
        //
        case WALLET_TYPES.MNEMONIC:
          return <Mnemonic advanced={true} loginCompleted={loginCompleted} />;
        case WALLET_TYPES.PRIVATE_KEY:
          return <PrivateKey loginCompleted={loginCompleted} />;
        case WALLET_TYPES.KEYSTORE:
          return <Keystore loginCompleted={loginCompleted} />;
        //
        default:
          return <P>{'Coming soon.'}</P>;
      }
    })();

    return (
      <Row>
        <Col>
          <InnerLabelDropdown
            className={'mb-10 mt-6'}
            title={'Wallet Type:'}
            options={this.getWalletOptions()}
            handleUpdate={this.handleSelection}
            currentSelectionTitle={renderWalletType(this.state.selected)}
          />

          {inputs}
        </Col>
      </Row>
    );
  }
}

export default compose(withWallet)(Advanced);
