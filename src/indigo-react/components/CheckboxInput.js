import React from 'react';
import cn from 'classnames';

import Flex from './Flex';
import { useField } from 'react-final-form';
import { Checkbox } from '@tlon/indigo-react';

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
          'lh-tall us-none pointer flex-row align-center'
        )}
        style={{ fontSize: '14px' }}
        htmlFor={name}>
        <Flex style={{ marginRight: '8px' }}>
          <Checkbox selected={input.checked} />
        </Flex>
        {label}
      </Flex.Item>
    </Flex>
  );
}
