import { Box, Text } from '@tlon/indigo-react';
import { CSSTransition } from 'react-transition-group';

type ActivateHeaderProps = {
  copy: string;
  isIn: boolean;
};

const ActivateHeader = ({ copy, isIn = false }: ActivateHeaderProps) => {
  return (
    <CSSTransition in={isIn} classNames="fadeable" timeout={300}>
      <Box>
        <Text
          display="block"
          fontFamily="Inter"
          fontSize={3}
          fontWeight="medium"
          mx={3}
          my={3}
          textAlign="center">
          {copy}
        </Text>
      </Box>
    </CSSTransition>
  );
};

export default ActivateHeader;
