import React from 'react';
import cn from 'classnames';

import Flex from './Flex';

// TODO: make this look like screens
export default function CheckboxInput({
  // visuals
  name,
  label,
  className,

  // callbacks
  onValue,
  onEnter,

  // state from hook
  focused,
  pass,
  visiblyPassed,
  error,
  data,
  bind,
  autoFocus,
  disabled,

  // ignored
  initialValue,
  validators,
  transformers,

  // extra
  ...rest
}) {
  return (
    <Flex
      className={className}
      row
      align="center"
      style={{
        ...(disabled && {
          pointerEvents: 'none',
          cursor: 'not-allowed',
        }),
      }}>
      <Flex.Item
        as="input"
        {...rest}
        className={cn(
          'b b1 p3 outline-none',
          {
            'bg-white': !disabled,
            'bg-gray1': disabled,
          },
          {
            gray4: !focused,
            black: focused,
          },
          {
            'b-green3': visiblyPassed,
            'b-black': focused && !visiblyPassed,
            'b-yellow3': !focused && error,
            'b-gray3': !focused && !error && !visiblyPassed,
          }
        )}
        id={name}
        name={name}
        {...bind}
      />
      <Flex.Item
        as="label"
        className="f6 ph3 lh-tall us-none"
        htmlFor={name}
        flex>
        {label}
      </Flex.Item>
    </Flex>
  );
}
