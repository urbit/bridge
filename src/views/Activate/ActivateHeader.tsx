import { Box, Text } from '@tlon/indigo-react';

type ActivateHeaderProps = {
  copy: string;
};

const ActivateHeader = ({ copy }: ActivateHeaderProps) => {
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
