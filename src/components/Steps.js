import React from 'react';
import cn from 'classnames';
import { Text } from 'indigo-react';

export default function Steps({ num = 1, total = 3, className, ...rest }) {
  return (
    <Text className={cn('f5 gray3', className)} {...rest}>
      <Text className="f5 black">Step {num}</Text> of {total}
    </Text>
  );
}
