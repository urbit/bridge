import { Box, Text } from '@tlon/indigo-react';
import withFadeable from './withFadeable';

type ActivateHeaderProps = {
  content: string | React.ReactNode;
  fadeTimeout?: number;
  isInOverride?: boolean;
};

const ActivateHeader = ({ content }: ActivateHeaderProps) => {
  return (
    <Box>
      <Text
        display="block"
        fontFamily="Inter"
        fontSize={'16px'}
        fontWeight={600}
        mx={3}
        my={3}
        textAlign="center">
        {content}
      </Text>
    </Box>
  );
};

export default ActivateHeader;

export const FadeableActivateHeader = withFadeable(ActivateHeader);
