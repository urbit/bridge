import React from 'react';
import cn from 'classnames';
import { Flex, Text } from 'indigo-react';

export default function NoticeBox({ className, children }) {
  return (
    <Flex
      className={cn('bg-gray2 pv3 ph4', className)}
      align="center"
      role="alert">
      <Text className="f6 fw-bold gray4">{children}</Text>
    </Flex>
  );
}
