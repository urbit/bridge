import React from 'react';
import cn from 'classnames';
import { useField } from 'react-final-form';

import Flex from './Flex';
import { ErrorText } from './Typography';

export default function Input({
  // visuals
  type,
  name,
  label,
  className,
  accessory,
  disabled = false,
  mono = false,

  // callbacks
  onEnter,

  // state
  config,

  // extra
  ...rest
}) {
  const {
    input,
    meta: {
      active,
      error,
      submitting,
      touched,
      valid,
      data: { warning },
    },
  } = useField(name, config);

  disabled = disabled || submitting;

  // notify parent of enter keypress iff not disabled and passing
  // TODO: integrate this into react-final-form submission
  // const onKeyPress = useCallback(
  //   e => !disabled && valid && e.key === 'Enter' && onEnter && onEnter(),
  //   [disabled, valid] // eslint-disable-line react-hooks/exhaustive-deps
  // );

  return (
    <Flex
      col
      className={cn(className, 'mb1')}
      style={{
        ...(disabled && {
          pointerEvents: 'none',
          cursor: 'not-allowed',
        }),
      }}>
      <Flex.Item
        as="label"
        className={cn('f6 lh-tall', {
          black: !disabled,
          gray4: disabled,
        })}
        htmlFor={name}>
        {label}
      </Flex.Item>
      <Flex.Item as={Flex} row className="rel">
        <Flex.Item
          flex
          as={type === 'textarea' ? 'textarea' : 'input'}
          {...rest}
          // NOTE: 24px = 12px * 2 (from p3 styling)
          style={type === 'textarea' ? { minHeight: 'calc(1rem + 24px)' } : {}}
          className={cn(
            'b b1 p3 outline-none',
            { mono },
            {
              'bg-white': !disabled,
              'bg-gray1': disabled,
            },
            {
              gray4: !(active || touched),
              black: active || touched,
            },
            {
              'b-green3': valid,
              'b-black': !valid && active,
              'b-yellow3': !valid && !active && touched && error,
              'b-gray2': !valid && !active && !touched && !error,
            }
          )}
          id={name}
          name={name}
          {...input}
          type={type === 'textarea' ? undefined : type}
        />
        {accessory && (
          <div
            className="abs"
            style={{
              top: 0,
              right: 0,
              height: '100%',
              width: '44px',
              overflow: 'hidden',
            }}>
            {accessory}
          </div>
        )}
      </Flex.Item>

      {warning && (
        <Flex.Item as={ErrorText} className="mv1">
          {warning}
        </Flex.Item>
      )}

      {touched && !active && error && (
        <Flex.Item as={ErrorText} className="mv1">
          {error}
        </Flex.Item>
      )}
    </Flex>
  );
}
