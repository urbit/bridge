import { Box, Text } from '@tlon/indigo-react';
import { DEFAULT_FADE_TIMEOUT } from 'lib/constants';
import { CSSTransition } from 'react-transition-group';
import { useActivateFlow } from './ActivateFlow';
import withFadeable from './withFadeable';

type ActivateHeaderProps = {
  copy: string;
  fadeTimeout?: number;
  isInOverride?: boolean;
};

const ActivateHeader = ({ copy }: ActivateHeaderProps) => {
  const { isIn } = useActivateFlow();

  return (
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
  );
};

export default ActivateHeader;

export const FadeableActivateHeader = withFadeable(ActivateHeader);
