import React, { useCallback } from 'react';
import cn from 'classnames';

import Flex from './Flex';
import { ErrorText } from './Typography';

export default React.memo(function Input({
  // visuals
  name,
  label,
  className,
  accessory,
  mono = false,

  // callbacks
  onEnter,

  // state from hook
  focused,
  pass,
  syncPass,
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
  // NB(shrugs): we disable exhaustive deps because we don't want the callbacks
  // (whose identity might change between renders) to trigger a re-notify of
  // state that we already know
  // this also happens to prevent render loops when rendering a map of inputs

  // notify parent of enter keypress iff not disabled and passing
  const onKeyPress = useCallback(
    e => !disabled && pass && e.key === 'Enter' && onEnter && onEnter(),
    [disabled, pass] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <Flex
      className={cn(className, 'mb1')}
      col
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
      <Flex.Item as={Flex} className="rel" row>
        <Flex.Item
          as="input"
          {...rest}
          className={cn(
            'b b1 p3 outline-none',
            { mono },
            {
              'bg-white': !disabled,
              'bg-gray1': disabled,
            },
            {
              gray4: !focused,
              black: focused,
            },
            {
              'b-green3': visiblyPassed,
              'b-black': focused && !visiblyPassed,
              'b-yellow3': !focused && hintError,
              'b-gray2': !focused && !hintError && !visiblyPassed,
            }
            // TODO: inputClassName ?
          )}
          id={name}
          name={name}
          onKeyPress={onKeyPress}
          {...bind}
          flex
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
      {error && (
        <Flex.Item as={ErrorText} className="mv1">
          {error}
        </Flex.Item>
      )}
    </Flex>
  );
});
