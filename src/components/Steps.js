import React from 'react';
import cn from 'classnames';
import { Text } from 'indigo-react';

export default function Steps({ num = 1, total = 3, className }) {
  return (
    <Text className={cn('f6 gray3', className)}>
      <Text className="f6 black">Step {num}</Text> of {total}
    </Text>
  );
}
