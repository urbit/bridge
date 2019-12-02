import React from 'react';
import { fromWei, toBN } from 'web3-utils';

import Highlighted from './Highlighted';
import CopiableAddress from './CopiableAddress';
import WarningBox from './WarningBox';
import Blinky from './Blinky';

export default function NeedFundsNotice({
  address,
  minBalance,
  balance,
  ...rest
}) {
  return (
    <WarningBox {...rest}>
      <Highlighted warning>
        Your ownership address <CopiableAddress>{address}</CopiableAddress>{' '}
        needs at least {fromWei(toBN(minBalance))} ETH and currently has{' '}
        {fromWei(toBN(balance))} ETH. The transaction will automatically resume
        once enough ETH is available. Waiting... <Blinky />
      </Highlighted>
    </WarningBox>
  );
}
