import Maybe from 'folktale/maybe';
import React from 'react';
import * as need from '../lib/need';
import { H1, H3, P, Warning, Anchor } from '../components/old/Base';
import { Button } from '../components/old/Base';

import { ROUTE_NAMES } from '../lib/routeNames';
import { useHistory } from '../store/history';
import { BRIDGE_ERROR, renderTxnError } from '../lib/error';
import { NETWORK_TYPES } from '../lib/network';
import { useNetwork } from '../store/network';
import { useTxnCursor } from '../store/txnCursor';
import View from 'components/View';
import { Grid } from 'indigo-react';

class Success extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pending: '.',
      interval: null,
    };
  }

  componentDidMount() {
    const nextDot = { '.': '..', '..': '...', '...': '.' };

    const interval = setInterval(() => {
      this.setState(({ pending }) => ({ pending: nextDot[pending] }));
    }, 1000);
    this.setState({ interval: interval });
  }

  componentWillUnmount() {
    clearInterval(this.state.interval);
  }

  render() {
    const { props, state } = this;
    const { networkType, hash } = props;
    const { pending } = state;

    const esvisible =
      networkType === NETWORK_TYPES.ROPSTEN ||
      networkType === NETWORK_TYPES.MAINNET;

    const esdomain =
      networkType === NETWORK_TYPES.ROPSTEN
        ? 'ropsten.etherscan.io'
        : 'etherscan.io';

    const esmessage =
      esvisible === true
        ? 'If you’d like to keep track of it, click the Etherscan link below.'
        : '';

    const esanchor =
      esvisible === false ? null : (
        <Anchor
          className={'mb-4 mt-1'}
          prop-size={'sm'}
          target={'_blank'}
          href={`https://${esdomain}/tx/${hash}`}>
          {'View on Etherscan ↗'}
        </Anchor>
      );

    const confirmations = 1;

    const requiredConfirmations = 1;

    const status =
      confirmations < requiredConfirmations
        ? `Pending${pending}`
        : `Confirmed! (x${confirmations} confirmations)!`;

    return (
      <Grid>
        <Grid.Item full>
          <H1>{'Your Transaction was Sent'}</H1>

          <P>
            {`We sent your transaction to the chain. It can take some time to
            execute, especially if the network is busy. ${esmessage}`}
          </P>

          <H3>{'Transaction Hash'}</H3>
          <P>{hash}</P>

          <H3>{'Transaction Status'}</H3>
          <P>{status}</P>
          <P>{esanchor}</P>
        </Grid.Item>
      </Grid>
    );
  }
}

const Failure = props => (
  <Grid>
    <Grid.Item full>
      <H1>{'Error!'}</H1>

      <Warning>
        <H3>{'There was an error sending your transaction.'}</H3>
        {renderTxnError(props.web3, props.message)}
      </Warning>
    </Grid.Item>
  </Grid>
);

function SentTransaction(props) {
  const history = useHistory();
  const { web3, networkType } = useNetwork();
  const { txnCursor } = useTxnCursor();

  const promptKeyfile = history.data && history.data.promptKeyfile;

  const w3 = need.web3(web3);

  const result = txnCursor.matchWith({
    Nothing: _ => {
      throw new Error(BRIDGE_ERROR.MISSING_TXN);
    },
    Just: res => res.value,
  });

  const body = result.matchWith({
    Error: message => <Failure web3={w3} message={message.value} />,
    Ok: hash => <Success hash={hash.value} networkType={networkType} />,
  });

  const ok = (
    <Grid>
      <Grid.Item full>
        <Button
          prop-type={'link'}
          onClick={() => {
            history.pop();
          }}>
          {'Ok →'}
        </Button>
      </Grid.Item>
    </Grid>
  );

  let keyfile;

  if (promptKeyfile) {
    keyfile = (
      <Grid>
        <Grid.Item full>
          <Button
            prop-type={'link'}
            onClick={() => history.popAndPush(ROUTE_NAMES.GEN_KEYFILE)}>
            {'Download Keyfile →'}
          </Button>
        </Grid.Item>
      </Grid>
    );
  }

  return (
    <View>
      {body}
      {ok}
      {keyfile}
    </View>
  );
}

export default SentTransaction;
