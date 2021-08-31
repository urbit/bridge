import React from 'react';
import { safeFromWei } from '../lib/lib';

import Highlighted from './Highlighted';
import CopiableAddress from './copiable/CopiableAddress';
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
        needs at least {safeFromWei(minBalance)} ETH and currently has{' '}
        {safeFromWei(balance)} ETH. Transaction costs may be high due to{' '}
        Ethereum network activity. You can come back later to try again, or{' '}
        transfer the required ETH now. The transaction will automatically resume{' '}
        once enough ETH is available. Waiting... <Blinky />
      </Highlighted>
    </WarningBox>
  );
}
