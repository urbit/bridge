import { Box, Row, Icon } from '@tlon/indigo-react';
import { L1TxnType } from 'lib/types/PendingL1Transaction';
import { useExploreTxUrl } from 'lib/explorer';
import LayerIndicator from './LayerIndicator';

import './PendingTransaction.scss';

export const getPendingL1Title = (type?: L1TxnType) =>
  type === L1TxnType.setNetworkKeys
    ? 'Network Keys Configured'
    : type === L1TxnType.managementProxy
    ? 'Management Address Changed'
    : type === L1TxnType.transferProxy
    ? 'Transfer Proxy Changed'
    : type === L1TxnType.spawnProxy
    ? 'Spawn Proxy Changed'
    : type === L1TxnType.spawnPoint
    ? 'Spawn Point'
    : type === L1TxnType.acceptTransfer
    ? 'Accept Transfer'
    : type === L1TxnType.migrate
    ? 'Migrate to Layer 2'
    : type === L1TxnType.migrateSpawn
    ? 'Set Spawn Proxy to Layer 2'
    : '';

interface Props {
  title: string;
  nextRoll?: string;
  hash?: string;
  layer: 1 | 2;
}

const PendingTransactionComponent: React.FC<Props> = ({
  title,
  nextRoll,
  hash,
  layer,
}) => {
  const txHash = useExploreTxUrl(hash);

  return (
    <Box className="pending-transaction">
      <Row className="title-row">
        <Box className="title">{title}</Box>
        {hash ? (
          <a className="hash" href={txHash} rel="noreferrer" target="_blank">
            Etherscan
            <Icon className="arrow" icon="ArrowEast" />
          </a>
        ) : (
          <Box className="rollup-timer">
            <Icon icon="Clock" />
            {nextRoll}
          </Box>
        )}
      </Row>
      <Row className="info-row">
        <LayerIndicator layer={layer} size="sm" />
        <Box className="date"></Box>
      </Row>
    </Box>
  );
};

export default PendingTransactionComponent;
