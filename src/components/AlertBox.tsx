import React from 'react';
import cn from 'classnames';
import { Flex, Text } from 'indigo-react';
import { Icon } from '@tlon/indigo-react';

export default function AlertBox({ className, children }) {
  return (
    <Flex className={cn('bg-red5 pv3 ph4', className)} align="center">
      <span className="circular-icon-bg bg-red6">
        <Icon
          display="inline-block"
          icon="ExclaimationMark"
          size="18px"
          color={'white'}
        />
      </span>
      <Text className="f6 fw-bolder red5">{children}</Text>
    </Flex>
  );
}
