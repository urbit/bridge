import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cn from 'classnames';

import { Flex } from 'indigo-react';

import { compose } from 'lib/lib';
import { kDefaultValidator } from 'lib/validators';

function useInput({
  validators = [],
  transformers = [],
  initialValue = '',
  autoFocus = false,
}) {
  const [value, setValue] = useState(initialValue);
  const [focused, setFocused] = useState(autoFocus);
  const [hasBeenFocused, setHasBeenFocused] = useState(false);

  // NB(shrugs)
  // TL;DR: This is what we want, the exhaustive deps rule is being too nosy.
  //
  // Here we memo-construct the `validate` and `transform` functions
  // based on the prop arguments. We explicitly disable the exhausive deps rule
  // because eslint wants an inline array specifying our dependencies.
  //
  // If we were to place the array of validators or transformers into
  // the dependency array like `[validators]`, we would end up creating a new
  // `validate` function every render, since deps are shallow-compared with
  // `Object.is`. Because the array of validators are constructed as part of
  // a component's render() function like:
  //
  // export function MnemonicInput(props) {
  //   return (
  //     <Input
  //       type="text"
  //       autoComplete="off"
  //       placeholder={`e.g. ${kExampleMnemonic}`}
  //       validators={[validateMnemonic, validateNotEmpty]}
  //       {...props}
  //     />
  //   );
  // }
  //
  // we create a new array, which shallowly compares as not-equal
  // between renders.
  //
  // So, in this specific case, we disable the rule and pass the
  // array of validators (and transformers) themselves as dependencies.
  // This means that validators and transformers can change between renders
  // and we will re-create the composed `validate` and `transform` functions
  // as expected.
  //
  // For context, an alternative solution I tried was defining the array of
  // validators as a constant array outside of the render method, but:
  //  1. It wasn't as clean or useful as specifying them inline,
  //  2. It would mean that validators could not be updated between renders,
  //  3. And the situation we have now feels naturally more 'correct'.
  //
  /* eslint-disable react-hooks/exhaustive-deps */
  const transform = useMemo(() => compose(...transformers), transformers);
  const validate = useMemo(
    () =>
      compose(
        ...validators,
        kDefaultValidator
      ),
    validators
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const onChange = useCallback(
    e => setValue(transform(e.target.value)), //
    [transform]
  );
  const onFocus = useCallback(
    e => setFocused(true), //
    [setFocused]
  );
  const onBlur = useCallback(
    e => {
      setFocused(false);
      setHasBeenFocused(true);
    },
    [setFocused, setHasBeenFocused]
  );

  // memo-compute whether or not the current value is valid
  const { pass, error: _error, data } = useMemo(
    () => validate(value), //
    [validate, value]
  );

  // only set error if it should be visible
  const error = !pass && hasBeenFocused && !focused && _error;
  // visibly tell the user that their input has passed if it has passed
  // and they are or have interacted with the input before
  const visiblyPassed = pass && (hasBeenFocused || focused);

  return {
    pass,
    visiblyPassed,
    error,
    data,
    focused,
    bind: {
      value,
      onChange,
      focused: focused ? 'true' : 'false',
      // ^ dom wants string value for focused
      onFocus,
      onBlur,
    },
  };
}

export default function Input({
  name,
  label,
  initialValue = '',
  className = '',
  validators = [],
  transformers = [],
  onValue,
  onPass,
  onError,
  onFocus,
  onEnter,
  accessory,
  disabled = false,
  mono = false,
  autoFocus = false,
  ...rest
}) {
  const actuallyAutoFocus = autoFocus && !disabled;
  const { focused, pass, visiblyPassed, error, data, bind } = useInput({
    validators,
    transformers,
    initialValue,
    autoFocus: actuallyAutoFocus,
  });

  // notify parent of enter keypress iff not disabled
  const onKeyPress = useCallback(
    e => !disabled && e.key === 'Enter' && onEnter && onEnter(),
    [disabled, onEnter]
  );

  // notify parent of value only when passing
  useEffect(() => {
    pass && onValue && onValue(data);
  }, [pass, data, onValue]);

  // notify parent of pass
  useEffect(() => {
    onPass && onPass(pass);
  }, [pass, onPass]);

  // notify parent of error whenever error changes
  useEffect(() => {
    onError && onError(error);
  }, [error, onError]);

  // notify parent of focus
  useEffect(() => {
    onFocus && onFocus(focused);
  }, [focused, onFocus]);

  return (
    <Flex col>
      <Flex.Item as="label" className="f6 lh-tall" htmlFor={name}>
        {label}
      </Flex.Item>
      <Flex row>
        <Flex.Item
          as="input"
          {...rest}
          cols={[1, accessory ? 11 : 13]}
          className={cn(
            'b b1 p3',
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
              'b-yellow3': !focused && !visiblyPassed && error,
              'b-gray3': !focused && !error && !visiblyPassed,
            },
            className
          )}
          style={{
            ...(disabled && { pointerEvents: 'none', cursor: 'not-allowed' }),
          }}
          onKeyPress={onKeyPress}
          id={name}
          autoFocus={actuallyAutoFocus}
          {...bind}
          flex
        />
        {accessory && (
          <Flex.Item style={{ height: '45px', overflow: 'hidden' }}>
            {accessory}
          </Flex.Item>
        )}
      </Flex>
    </Flex>
  );
}
