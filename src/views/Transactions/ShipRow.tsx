import { Box, Row } from '@tlon/indigo-react';
import Sigil from 'components/Sigil';

export const ShipRow = ({ patp }) => {
  return (
    <>
      <Box className="ship-row">
        <Box className="icon">
          <Box className="sigil">
            {
              <Sigil
                icon
                patp={patp}
                colors={['black', 'white']}
                size={12}
                display="block"
                padding={6}
                borderRadius={2}
              />
            }
          </Box>
        </Box>
        <Box className="info">
          <Box className="patp">~{patp}</Box>
        </Box>
      </Box>
    </>
  );
};
