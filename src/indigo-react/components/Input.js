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
  accessoryWidth = 'calc(1.5em + 24px)',
  labelAccessory,
  disabled = false,
  mono = false,
  obscure,

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
      submitError,
      dirtySinceLastSubmit,
      submitting,
      submitSucceeded,
      touched,
      valid,
    },
  } = useField(name, config);

  disabled = disabled || submitting || submitSucceeded;

  // choose the base dom component
  const BaseComponent = type === 'textarea' ? 'textarea' : 'input';

  // notify parent of enter keypress iff not disabled and passing
  // TODO: integrate this into react-final-form submission
  // const onKeyPress = useCallback(
  //   e => !disabled && valid && e.key === 'Enter' && onEnter && onEnter(),
  //   [disabled, valid] // eslint-disable-line react-hooks/exhaustive-deps
  // );

  const showError = !!error;
  const showSubmitError = !!submitError && !dirtySinceLastSubmit;
  const indicateError = touched && !active && (showError || showSubmitError);

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
        as={Flex}
        justify="between"
        align="center"
        className={cn('f6 lh-tall', {
          black: !disabled,
          gray4: disabled,
        })}>
        <Flex.Item as="label" justify htmlFor={name}>
          {label}
        </Flex.Item>
        {labelAccessory && <Flex.Item>{labelAccessory}</Flex.Item>}
      </Flex.Item>
      <Flex.Item as={Flex} row className="rel">
        <Flex.Item
          flex
          as={BaseComponent}
          {...rest}
          // NOTE: 1.15 from input line-height, 24px = 12px * 2 (from p3 styling)
          style={type === 'textarea' ? { minHeight: 'calc(1.5rem * 3)' } : {}}
          className={cn(
            'b b1 p3 outline-none bs-none',
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
              'b-yellow3': !valid && !active && touched,
              'b-gray2': !valid && !active && !touched,
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
              width: accessoryWidth,
              height: '100%',
              overflow: 'hidden',
            }}>
            {accessory}
          </div>
        )}
      </Flex.Item>

      {indicateError && (
        <Flex.Item as={ErrorText} className="mv1">
          {error || submitError}
        </Flex.Item>
      )}
    </Flex>
  );
}
