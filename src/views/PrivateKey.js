import Maybe from 'folktale/maybe';
import React from 'react';
import { Button } from '../components/old/Base';
import {
  RequiredInput,
  InnerLabel,
  InputCaption,
} from '../components/old/Base';
import { H1 } from '../components/old/Base';

import { ROUTE_NAMES } from '../lib/routeNames';
import { withHistory } from '../store/history';
import { EthereumWallet } from '../lib/wallet';
import { compose } from '../lib/lib';
import { withWallet } from '../store/wallet';
import View from 'components/View';

class PrivateKey extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      privateKey: '',
    };

    this.handlePrivateKeyInput = this.handlePrivateKeyInput.bind(this);
  }

  handlePrivateKeyInput(privateKey) {
    this.setState({ privateKey });
    this.constructWallet(privateKey);
  }

  constructWallet(privateKey) {
    const { setWallet } = this.props;
    if (/^[0-9A-Fa-f]{64}$/g.test(privateKey) === true) {
      const sec = Buffer.from(privateKey, 'hex');
      const wallet = new EthereumWallet(sec);
      setWallet(Maybe.Just(wallet));
    } else {
      setWallet(Maybe.Nothing());
    }
  }

  render() {
    const { history, wallet } = this.props;
    const { privateKey } = this.state;

    return (
      <View>
        <H1 className={'mb-4'}>{'Enter Your Private Key'}</H1>
        <InputCaption>
          {`Please enter your raw Ethereum private key here.`}
        </InputCaption>

        <RequiredInput
          className="pt-8 mt-8"
          prop-size="md"
          prop-format="innerLabel"
          type="password"
          name="privateKey"
          onChange={this.handlePrivateKeyInput}
          value={privateKey}
          autocomplete="off"
          autoFocus>
          <InnerLabel>{'Private Key'}</InnerLabel>
        </RequiredInput>

        <Button
          className={'mt-10'}
          prop-size={'wide lg'}
          disabled={Maybe.Nothing.hasInstance(wallet)}
          onClick={() => history.popAndPush(ROUTE_NAMES.SHIPS)}>
          {'Continue →'}
        </Button>
      </View>
    );
  }
}

export default compose(
  withHistory,
  withWallet
)(PrivateKey);
