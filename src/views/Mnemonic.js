import * as bip39 from 'bip39';
import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import { Button } from '../components/old/Base';
import {
  Input,
  MnemonicInput,
  InnerLabel,
  InputCaption,
} from '../components/old/Base';
import { Row, Col, H1 } from '../components/old/Base';

import { ROUTE_NAMES } from '../lib/routeNames';
import { withHistory } from '../store/history';
import { DEFAULT_HD_PATH, walletFromMnemonic } from '../lib/wallet';
import { compose } from '../lib/lib';
import { withWallet } from '../store/wallet';

class Mnemonic extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mnemonic: '',
      passphrase: '',
      hdpath: DEFAULT_HD_PATH,
    };

    this.handleMnemonicInput = this.handleMnemonicInput.bind(this);
    this.handlePassphraseInput = this.handlePassphraseInput.bind(this);
    this.handleHdPathInput = this.handleHdPathInput.bind(this);
  }

  componentDidMount() {
    const { mnemonic, hdpath, passphrase } = this.state;
    this.attemptWalletDerivation(mnemonic, hdpath, passphrase);

    this.setState({
      exampleMnemonic: bip39.generateMnemonic(),
    });
  }

  handlePassphraseInput(passphrase) {
    this.setState((state, _) => {
      const mnemonic = state.mnemonic;
      const hdpath = state.hdpath;
      this.attemptWalletDerivation(
        mnemonic,
        hdpath === '' ? DEFAULT_HD_PATH : hdpath,
        passphrase
      );
      return {
        passphrase,
      };
    });
  }

  handleMnemonicInput(mnemonic) {
    this.setState((state, _) => {
      const hdpath = state.hdpath;
      const passphrase = state.passphrase;
      this.attemptWalletDerivation(
        mnemonic,
        hdpath === '' ? DEFAULT_HD_PATH : hdpath,
        passphrase
      );
      return {
        mnemonic,
      };
    });
  }

  handleHdPathInput(hdpath) {
    this.setState((state, _) => {
      const mnemonic = state.mnemonic;
      const passphrase = state.passphrase;
      this.attemptWalletDerivation(
        mnemonic,
        hdpath === '' ? DEFAULT_HD_PATH : hdpath,
        passphrase
      );
      return {
        hdpath,
      };
    });
  }

  attemptWalletDerivation(mnemonic, hdpath, passphrase) {
    const { setWallet, setAuthMnemonic, setWalletHdPath } = this.props;
    const wallet = walletFromMnemonic(mnemonic, hdpath, passphrase);
    setWallet(wallet);
    setAuthMnemonic(Just(mnemonic));
    setWalletHdPath(hdpath);
  }

  render() {
    const { history, wallet } = this.props;
    const { mnemonic, hdpath, exampleMnemonic, passphrase } = this.state;

    return (
      <Row>
        <Col>
          <H1 className={'mb-4'}>{'Enter Your Mnemonic'}</H1>
          <InputCaption>
            {'Please enter your BIP39 mnemonic here.'}
          </InputCaption>

          <MnemonicInput
            className="pt-8"
            prop-size="md"
            prop-format="innerLabel"
            type="text"
            name="mnemonic"
            placeholder={`e.g. ${exampleMnemonic}`}
            onChange={this.handleMnemonicInput}
            value={mnemonic}
            autocomplete="off"
            autoFocus>
            <InnerLabel>{'Mnemonic'}</InnerLabel>
          </MnemonicInput>

          <InputCaption>
            {`If your wallet requires a passphrase, you may enter it below.`}
          </InputCaption>

          <Input
            className="pt-8"
            prop-size="md"
            prop-format="innerLabel"
            name="passphrase"
            type="password"
            value={passphrase}
            autocomplete="off"
            onChange={this.handlePassphraseInput}>
            <InnerLabel>{'Passphrase'}</InnerLabel>
          </Input>

          <InputCaption>
            {`If you'd like to use a custom derivation path, you may enter it below.`}
          </InputCaption>

          <Input
            className="pt-8 text-mono"
            prop-size="md"
            prop-format="innerLabel"
            name="hdpath"
            value={hdpath}
            autocomplete="off"
            onChange={this.handleHdPathInput}>
            <InnerLabel>{'HD Path'}</InnerLabel>
          </Input>

          <Button
            className={'mt-10'}
            disabled={Nothing.hasInstance(wallet)}
            onClick={() => history.popAndPush(ROUTE_NAMES.SHIPS)}>
            {'Continue →'}
          </Button>
        </Col>
      </Row>
    );
  }
}

export default compose(
  withHistory,
  withWallet
)(Mnemonic);
