import ob from 'urbit-ob';
import { Box, Icon, Text} from '@tlon/indigo-react';
import { Ship } from '@urbit/roller-api';
import Sigil from 'components/Sigil';
import { useCallback, useState } from 'react';

interface ResidentRowProps {
  point: Ship;
  onKick: (point: Ship) => Promise<void>;
}

export const ResidentRow = ({ point, onKick }: ResidentRowProps) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const handleKickClick = useCallback(async () => {
    setShowDropdown(false);
    await onKick(point);
  }, [onKick, point]);

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
      <Box
        className="button-wrapper"
        onClick={() => setShowDropdown(!showDropdown)}>
        <Icon icon="Ellipsis" size="18px" />
        {showDropdown && (
          <Box className={'kick-dropdown'} onClick={handleKickClick}>
            <Text>Kick</Text>
          </Box>
        )}
      </Box>
    </li>
  );
};
