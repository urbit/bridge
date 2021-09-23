import { Box, Text } from '@tlon/indigo-react';
import withFadeable from './withFadeable';

type ActivateParagraphProps = {
  copy: string;
  fadeTimeout?: number;
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
        lineHeight={'20px'}
        color={'rgba(0,0,0,0.6)'}
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

export const FadeableActivateParagraph = withFadeable(ActivateParagraph);
