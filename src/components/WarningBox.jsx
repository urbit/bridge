import React from 'react';
import cn from 'classnames';
import { Flex, Text } from 'indigo-react';

export default function WarningBox({ className, children }) {
  return (
    <Flex className={cn('bg-red1 pv3 ph4', className)} align="center">
      <Text className="f6 fw-bold red3">{children}</Text>
    </Flex>
  );
}
