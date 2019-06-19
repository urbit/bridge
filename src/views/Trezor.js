import * as bip32 from 'bip32';
import React from 'react';
import Maybe from 'folktale/maybe';
import { Button } from '../components/old/Base';
import { H1, P } from '../components/old/Base';
import { InnerLabel, Input, InnerLabelDropdown } from '../components/old/Base';
import TrezorConnect from 'trezor-connect';
import * as secp256k1 from 'secp256k1';

import { TREZOR_PATH } from '../lib/trezor';
import { ROUTE_NAMES } from '../lib/routeNames';
import { withHistory } from '../store/history';
import { compose } from '../lib/lib';
import { withWallet } from '../store/wallet';
import View from 'components/View';

class Trezor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hdpath: TREZOR_PATH.replace(/x/g, 0),
      account: 0,
    };

    this.handleAccountSelection = this.handleAccountSelection.bind(this);
    this.handleHdPathInput = this.handleHdPathInput.bind(this);
    this.pollDevice = this.pollDevice.bind(this);
  }

  handleAccountSelection(account) {
    let hdpath = this.state.hdpath;
    if (account !== 'custom') {
      hdpath = TREZOR_PATH.replace(/x/g, account);
    }
    this.setState({ account, hdpath });
  }

  handleHdPathInput(hdpath) {
    this.setState({ hdpath });
  }

  async pollDevice() {
    const { setWallet, setWalletHdPath } = this.props;
    const { hdpath } = this.state;

    TrezorConnect.manifest({
      email: 'bridge-trezor@urbit.org',
      appUrl: 'https://github.com/urbit/bridge',
    });
    TrezorConnect.getPublicKey({ path: hdpath }).then(info => {
      if (info.success === true) {
        const payload = info.payload;
        const publicKey = Buffer.from(payload.publicKey, 'hex');
        const chainCode = Buffer.from(payload.chainCode, 'hex');
        const pub = secp256k1.publicKeyConvert(publicKey, true);
        const hd = bip32.fromPublicKey(pub, chainCode);
        setWallet(Maybe.Just(hd));
        setWalletHdPath(hdpath);
      } else {
        setWallet(Maybe.Nothing());
      }
    });
  }

  render() {
    const { history, wallet } = this.props;
    const { hdpath, account } = this.state;
    const { handleAccountSelection } = this;

    let accountOptions = [
      {
        title: 'Custom path',
        value: 'custom',
      },
    ];
    for (let i = 0; i < 20; i++) {
      accountOptions.push({
        title: 'Account #' + (i + 1),
        value: i,
      });
    }
    let accountTitle = accountOptions.find(o => o.value === account).title;

    const accountSelection = (
      <InnerLabelDropdown
        className="mt-8"
        prop-size="md"
        prop-format="innerLabel"
        options={accountOptions}
        handleUpdate={handleAccountSelection}
        title={'Account'}
        currentSelectionTitle={accountTitle}
        fullWidth={true}
      />
    );

    const pathSelection =
      account !== 'custom' ? null : (
        <Input
          className="mt-8 pt-8 text-mono"
          prop-size="md"
          prop-format="innerLabel"
          name="hdpath"
          value={hdpath}
          autocomplete="off"
          onChange={this.handleHdPathInput}>
          <InnerLabel>{'HD Path'}</InnerLabel>
        </Input>
      );

    return (
      <View>
        <H1>{'Authenticate With Your Trezor'}</H1>

        <P>
          {`Connect and authenticate to your Trezor.  If you'd like
                to use a custom derivation path, you may enter it below.`}
        </P>

        {accountSelection}
        {pathSelection}

        <Button
          className={'mt-8'}
          prop-size={'wide lg'}
          onClick={this.pollDevice}>
          {'Authenticate →'}
        </Button>

        <Button
          className={'mt-8'}
          prop-size={'wide lg'}
          disabled={Maybe.Nothing.hasInstance(wallet)}
          onClick={() => history.popAndPush(ROUTE_NAMES.POINTS)}>
          {'Continue →'}
        </Button>
      </View>
    );
  }
}

export default compose(
  withHistory,
  withWallet
)(Trezor);
