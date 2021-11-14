import ob from 'urbit-ob';
import { Box, Button } from '@tlon/indigo-react';
import { Ship } from '@urbit/roller-api';
import Sigil from 'components/Sigil';
import { useCallback } from 'react';

interface RequestRowProps {
  point: Ship;
  onAccept: (point: Ship) => Promise<void>;
  onReject: (point: Ship) => Promise<void>;
}

export const RequestRow = ({ point, onAccept, onReject }: RequestRowProps) => {
  const handleAcceptClick = useCallback(async () => {
    await onAccept(point);
  }, [onAccept, point]);

  const handleRejectClick = useCallback(async () => {
    await onReject(point);
  }, [onReject, point]);

  return (
    <li key={point}>
      <Box className={'point-wrapper'}>
        <Box className="sigil">
          <Box className="sigil-container">
            <Sigil
              icon
              patp={ob.patp(point)}
              size={16}
              colors={['#000000', '#FFFFFF']}
            />
          </Box>
        </Box>
        <Box className={'patp'}>{ob.patp(point)}</Box>
      </Box>
      <Box className="button-wrapper">
        <Button className="primary" onClick={handleAcceptClick}>
          Accept
        </Button>
        <Button className="secondary" onClick={handleRejectClick}>
          Reject
        </Button>
      </Box>
    </li>
  );
};
