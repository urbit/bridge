import React, { useCallback, useRef, useState } from 'react';
import cn from 'classnames';

import Flex from './Flex';
import { ErrorText } from './Typography';
import useOnClickOutside from 'indigo-react/lib/useOnClickOutside';
import AccessoryIcon from './AccessoryIcon';

// NOTE: if we really care about accessibility, we should pull in a dependency
export default function SelectInput({
  // visuals
  name,
  label,
  className,
  accessory,
  mono = false,
  placeholder,

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
  options,

  // ignored
  initialValue,
  validators,
  transformers,

  // extra
  ...rest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  // close select on outside clicks
  useOnClickOutside(ref, useCallback(() => setIsOpen(false), [setIsOpen]));

  const toggleOpen = useCallback(() => setIsOpen(isOpen => !isOpen), [
    setIsOpen,
  ]);

  const onChange = value => {
    // TODO: provide setValue here?
    // construct a pseudo event that sets the value correctly
    bind.onChange({ target: { value } });
    setIsOpen(false);
  };

  // redefine accessory because we still want to ignore it from the ..rest above
  accessory = <AccessoryIcon>{isOpen ? '⬆' : '⬇'}</AccessoryIcon>;

  const text = options.find(o => o.value === data).text;

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
      <Flex.Item as="label" className="f6 lh-tall" htmlFor={name}>
        {label}
      </Flex.Item>
      <Flex.Item as={Flex} row className="rel clickable" onClick={toggleOpen}>
        <Flex.Item
          // as="select"
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
              'b-green3': visiblyPassed,
              'b-black': focused && !visiblyPassed,
              'b-yellow3': !focused && error,
              'b-gray3': !focused && !error && !visiblyPassed,
            }
          )}
          id={name}
          name={name}
          {...bind}
          flex>
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
          {accessory}
        </div>
        {isOpen && (
          <Flex
            col
            className="abs bg-white b-black b1 z10"
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
      {error && (
        <Flex.Item as={ErrorText} className="mv1">
          {error}
        </Flex.Item>
      )}
    </Flex>
  );
}
