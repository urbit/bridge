import React from 'react';
import cn from 'classnames';

import Flex from './Flex';
import { useField } from 'react-final-form';

export default function CheckboxInput({
  // visuals
  name,
  label,
  className,

  disabled,
}) {
  const {
    input,
    meta: { submitting },
  } = useField(name);

  disabled = disabled || submitting;

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
        type="checkbox"
        className="super-hidden"
        id={name}
        {...input}
        // TODO: this seems hacky... final-form should have a standard way to do this
        checked={input.value}
        onClick={e => input.onChange(!input.value)}
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
            'bg-black white b-black': !disabled && input.value,
            'bg-white black b-black': !disabled && !input.value,
          })}
          style={{
            height: '14px',
            width: '14px',
          }}>
          {input.value && '✓'}
        </Flex>
        {label}
      </Flex.Item>
    </Flex>
  );
}
