import React, { useCallback, useRef, useState } from 'react';
import cn from 'classnames';
import { useField } from 'react-final-form';
import useOnClickOutside from 'indigo-react/lib/useOnClickOutside';

import Flex from './Flex';
import { ErrorText } from './Typography';
import AccessoryIcon from './AccessoryIcon';

// NOTE: if we really care about accessibility, we should pull in a dependency
export default function SelectInput({
  name,
  label,
  placeholder,
  className,
  mono = false,
  options = [],
  disabled = false,
  warning,
}) {
  const {
    input,
    meta: {
      active,
      error,
      submitting,
      submitSucceeded,
      submitError,
      dirtySinceLastSubmit,
      touched,
      valid,
    },
  } = useField(name, {
    type: 'select',
  });

  disabled = disabled || submitting || submitSucceeded;

  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  // close select on outside clicks
  useOnClickOutside(ref, useCallback(() => setIsOpen(false), [setIsOpen]));

  const toggleOpen = useCallback(() => {
    input.onFocus();
    setIsOpen(isOpen => !isOpen);
  }, [input]);

  const onChange = value => {
    // construct a pseudo event that sets the value correctly
    input.onChange({ target: { value } });
    input.onBlur();
    setIsOpen(false);
  };

  const text = options.find(o => o.value === input.value).text;

  const showError = !!error;
  const showSubmitError = !!submitError && !dirtySinceLastSubmit;
  const indicateError = touched && !active && (showError || showSubmitError);
  const errorId = `${name}-error`;

  return (
    <Flex
      ref={ref}
      className={cn(className, 'mb1 us-none')}
      col
      style={{
        ...(disabled && {
          pointerEvents: 'none',
          cursor: 'not-allowed',
        }),
      }}>
      <Flex.Item as="label" htmlFor={name} className="f6 lh-tall">
        {label}
      </Flex.Item>
      <Flex.Item as={Flex} row className="rel pointer" onClick={toggleOpen}>
        <Flex.Item
          flex
          aria-invalid={indicateError}
          aria-describedBy={errorId}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={cn(
            'b b1 p3 outline-none',
            { mono },
            {
              'bg-white': !disabled,
              'bg-gray1': disabled,
            },
            {
              gray4: isOpen,
              black: !isOpen,
            },
            {
              'b-green3': valid,
              'b-black': !valid && active,
              'b-yellow3': !valid && !active && touched && error,
              'b-gray2': !valid && !active && !touched && !error,
            }
          )}
          id={name}
          name={name}>
          {isOpen ? placeholder : text}
        </Flex.Item>
        <div
          className="abs"
          style={{
            top: 0,
            right: 0,
            height: '100%',
            width: '44px',
            overflow: 'hidden',
          }}>
          <AccessoryIcon className="gray4">{isOpen ? '▲' : '▼'}</AccessoryIcon>
        </div>
        {isOpen && (
          <Flex
            col
            className="abs bg-white b-black b1 z10"
            role="menu"
            style={{
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              overflow: 'auto',
              maxHeight: '30vh',
            }}>
            {options.map(option => (
              <Flex.Item
                key={option.value}
                role="menuitem"
                className="pv2 ph3 hover-bg-grey3"
                onClick={e => {
                  e.stopPropagation();
                  onChange(option.value);
                }}>
                {option.text}
              </Flex.Item>
            ))}
          </Flex>
        )}
      </Flex.Item>

      {warning && (
        <Flex.Item as={ErrorText} className="mv1">
          {warning}
        </Flex.Item>
      )}

      {indicateError && (
        <Flex.Item id={errorId} as={ErrorText} className="mv1">
          {error}
        </Flex.Item>
      )}
    </Flex>
  );
}
