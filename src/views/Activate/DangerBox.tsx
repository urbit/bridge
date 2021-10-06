import { Box, Text } from '@tlon/indigo-react';
import React from 'react';
import cn from 'classnames';
import withFadeable from './withFadeable';

interface DangerBoxProps {
  children: React.ReactNode | string;
  className?: string;
}

const DangerBox = ({ children, className }: DangerBoxProps) => {
  return (
    <Box
      background={'rgb(246,200,196)'}
      border={'solid 1px rgb(236,81,66)'}
      padding={'15px 45px'}
      className={cn(['danger-box', className])}
      borderRadius={'5px'}>
      <Text color={'black'} fontSize={'16px'} fontFamily="Inter">
        {children}
      </Text>
    </Box>
  );
};

export default DangerBox;

export const FadeableDangerBox = withFadeable(DangerBox);
