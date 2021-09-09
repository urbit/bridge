import { Box, Text } from '@tlon/indigo-react';
import withFadeable from './withFadeable';

type ActivateHeaderProps = {
  copy: string;
  fadeTimeout?: number;
  isInOverride?: boolean;
};

const ActivateHeader = ({ copy }: ActivateHeaderProps) => {
  return (
    <Box>
      <Text
        display="block"
        fontFamily="Inter"
        fontSize={3}
        fontWeight={600}
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
