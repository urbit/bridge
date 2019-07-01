import React from 'react';
import cn from 'classnames';
import { Text } from 'indigo-react';

export default function Steps({ num = 1, total = 3, className }) {
  // NOTE: the 48px must match the `mt8` class on Passport for things to line
  // up nicely
  return (
    <Text className={cn('f5 gray3', className)} style={{ height: '48px' }}>
      <Text className="f5 black">Step {num}</Text> of {total}
    </Text>
  );
}
