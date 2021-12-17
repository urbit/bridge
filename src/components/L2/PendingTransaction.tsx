import { Box, Row, Icon } from '@tlon/indigo-react';
import { useExploreTxUrl } from 'lib/explorer';
import LayerIndicator from './LayerIndicator';

import './PendingTransaction.scss';

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
