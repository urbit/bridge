import ob from 'urbit-ob';
import { Box, Icon, Text } from '@tlon/indigo-react';
import { Ship } from '@urbit/roller-api';
import Sigil from 'components/Sigil';
import { useCallback, useRef, useState } from 'react';
import useOnClickOutside from 'lib/useOnClickOutside';

interface ResidentRowProps {
  point: Ship;
  onKick: (point: Ship) => Promise<void>;
}

export const ResidentRow = ({ point, onKick }: ResidentRowProps) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = useCallback((event: MouseEvent | TouchEvent) => {
    event.stopImmediatePropagation();
    setShowDropdown(false);
  }, []);

  useOnClickOutside(dropdownRef, handleClickOutside);

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
      <Box className="button-wrapper" ref={dropdownRef}>
        <Icon
          icon="Ellipsis"
          size="18px"
          onClick={() => setShowDropdown(!showDropdown)}
        />
        {showDropdown && (
          <>
            <Box
              className="close-background"
              onClick={() => setShowDropdown(false)}
            />
            <Box className="kick-dropdown" onClick={handleKickClick}>
              <Text>Kick</Text>
            </Box>
          </>
        )}
      </Box>
    </li>
  );
};
