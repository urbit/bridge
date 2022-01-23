import React from 'react';
import cn from 'classnames';

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
    <div
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
      <input checkbox className="super-hidden" id={name} {...input} />
      {/* and then display a prettier one in its stead */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        htmlFor={name}>
        <Checkbox selected={input.checked} style={{ marginRight: '8px' }} />
        {label}
      </label>
    </div>
  );
}
