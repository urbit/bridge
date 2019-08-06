import React from 'react';
import cn from 'classnames';

import Flex from './Flex';
import LinkButton from './LinkButton';
import { useField } from 'react-final-form';

export default function ToggleInput({
  // visuals
  name,
  label,
  inverseLabel,
  className,

  //
  disabled = false,

  ...rest
}) {
  const {
    input,
    meta: { submitting },
  } = useField(name, { type: 'checkbox' });

  disabled = disabled || submitting;

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
      {/* we totally hide the checkbox itself */}
      <Flex.Item
        as="input"
        {...rest}
        className={cn('super-hidden')}
        id={name}
        name={name}
        {...input}
      />
      {/* and then display a prettier one in its stead */}
      <Flex.Item
        flex
        as="label"
        className={cn('f6 pv2 lh-tall us-none flex-row align-center', {
          clickable: !disabled,
        })}
        htmlFor={name}>
        <LinkButton disabled={disabled} className="f5">
          {input.checked ? inverseLabel : label}
        </LinkButton>
      </Flex.Item>
    </Flex>
  );
}
