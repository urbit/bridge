import React from 'react';
import cn from 'classnames';

import Flex from './Flex';
import { useField } from 'react-final-form';

export default function CheckboxInput({
  // visuals
  name,
  label,
  className,
  style,
  inline = false,
  white = false,

  disabled,
}) {
  const {
    input,
    meta: { submitting, submitSucceeded },
  } = useField(name, { type: 'checkbox' });

  disabled = disabled || submitting || submitSucceeded;

  return (
    <Flex
      row
      align="center"
      className={cn(className, {
        mv2: !inline,
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
      <Flex.Item as="input" className="super-hidden" id={name} {...input} />
      {/* and then display a prettier one in its stead */}
      <Flex.Item
        flex
        as="label"
        className={cn(
          { mr3: !inline },
          'f6 lh-tall us-none pointer flex-row align-center'
        )}
        htmlFor={name}>
        <Flex
          justify="center"
          align="center"
          className={cn('b1 p1', {
            mr3: !inline,
            mr1: inline,
            'bg-gray1': disabled,
            'bg-black white b-black': !disabled && (input.value || white),
            'bg-white black b-black': !disabled && !input.value,
          })}
          style={{
            height: '14px',
            width: '14px',
            ...style,
          }}>
          {input.value && '✓'}
        </Flex>
        {label}
      </Flex.Item>
    </Flex>
  );
}
