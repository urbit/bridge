import React from 'react';

import { Button } from '../components/Base';
import { InnerLabelDropdown } from '../components/Base';
import { Row, Col, H1, P } from '../components/Base';
import { NETWORK_TYPES, renderNetworkType } from '../lib/network';
import { ROUTE_NAMES } from '../lib/routeNames';
import { useHistory } from '../store/history';
import { useNetwork } from '../store/network';

const kNetworkOptions = [
  {
    title: 'Main Network (default)',
    value: NETWORK_TYPES.MAINNET,
  },
  {
    title: 'Ropsten',
    value: NETWORK_TYPES.ROPSTEN,
  },
  {
    title: 'Local Node',
    value: NETWORK_TYPES.LOCAL,
  },
  {
    type: 'divider',
  },
  {
    title: 'Offline',
    value: NETWORK_TYPES.OFFLINE,
  },
];

function Network() {
  const { networkType, setNetworkType } = useNetwork();
  const history = useHistory();

  return (
    <Row>
      <Col>
        <H1>{'Select Network'}</H1>

        <P>
          {"Please select the Ethereum node you'd like to send " +
            'transactions to.  For highly valuable keys, please select ' +
            'offline mode.'}
        </P>

        <InnerLabelDropdown
          className={'mt-6'}
          title={'Node:'}
          handleUpdate={setNetworkType}
          options={kNetworkOptions}
          currentSelectionTitle={renderNetworkType(networkType)}
        />

        <Button
          className={'mt-10'}
          onClick={() => history.push(ROUTE_NAMES.WALLET)}>
          {'Continue  →'}
        </Button>
      </Col>
    </Row>
  );
}

export default Network;
