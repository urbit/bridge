import { Box, Text } from '@tlon/indigo-react';

type ActivateParagraphProps = {
  copy: string;
};

const ActivateParagraph = ({ copy }: ActivateParagraphProps) => {
  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      flexWrap={'nowrap'}
      justifyContent={'center'}
      alignItems={'center'}>
      <Text
        display="block"
        fontFamily="Inter"
        fontSize={2}
        mx={3}
        my={3}
        textAlign="center"
        width={'80%'}>
        {copy}
      </Text>
    </Box>
  );
};

export default ActivateParagraph;
