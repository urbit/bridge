import React from 'react';
import cn from 'classnames';

import Flex from './Flex';

export default function CheckboxInput({
  // visuals
  name,
  label,
  className,

  // callbacks
  onEnter,

  // state from hook
  focused,
  pass,
  visiblyPassed,
  error,
  hintError,
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
      row
      align="center"
      className={cn(className, 'mv2', {
        black: !disabled,
        gray4: disabled,
      })}
      style={{
        ...(disabled && {
          pointerEvents: 'none',
          cursor: 'not-allowed',
        }),
      }}>
      {/* we totally hide the checkbox itself */}
      <Flex.Item
        as="input"
        {...rest}
        className={cn('super-hidden')}
        id={name}
        name={name}
        {...bind}
      />
      {/* and then display a prettier one in its stead */}
      <Flex.Item
        flex
        as="label"
        className="f6 mr3 lh-tall us-none clickable flex-row align-center"
        htmlFor={name}>
        <Flex
          justify="center"
          align="center"
          className={cn('b1 p1 mr3', {
            'bg-gray1': disabled,
            'bg-black white b-black': !disabled && data,
            'bg-white black b-black': !disabled && !data,
          })}
          style={{
            height: '14px',
            width: '14px',
          }}>
          {data && '✓'}
        </Flex>
        {label}
      </Flex.Item>
    </Flex>
  );
}
