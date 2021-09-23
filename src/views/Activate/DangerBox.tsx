import { Box, Text } from '@tlon/indigo-react';
import React from 'react';
import withFadeable from './withFadeable';

interface DangerBoxProps {
  children: React.ReactNode | string;
}

const DangerBox = ({ children }: DangerBoxProps) => {
  return (
    <Box
      background={'rgb(246,200,196)'}
      border={'solid 1px rgb(236,81,66)'}
      padding={'15px 45px'}
      borderRadius={'5px'}>
      <Text color={'black'} fontSize={'16px'} fontFamily="Inter">
        {children}
      </Text>
    </Box>
  );
};

export default DangerBox;

export const FadeableDangerBox = withFadeable(DangerBox);
