import { Box } from '@tlon/indigo-react';
import Sigil from 'components/Sigil';

interface PatpRowProps {
  patp: string;
}

export const PatpRow = ({ patp }: PatpRowProps) => {
  return (
    <>
      <Box className="patp-row">
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
