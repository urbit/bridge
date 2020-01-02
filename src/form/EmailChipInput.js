import React, { useState, useCallback } from 'react';
import { isEqual } from 'lodash';
import { Flex, ErrorText } from 'indigo-react';
import cn from 'classnames';
import { useField } from 'react-final-form';

import { hasErrors } from 'form/validators';

const Chip = ({ value, onDelete, disabled }) => {
  return (
    <Flex
      className={cn('r32 ph2 m1 flex-center h7', {
        'bg-gray2': !disabled,
        'bg-gray1 gray4': disabled,
      })}>
      <Flex.Item>{value}</Flex.Item>
      <Flex.Item onClick={disabled ? onDelete : undefined} className="ml1 f6">
        ✗
      </Flex.Item>
    </Flex>
  );
};

const EmailChipInput = ({ className, name, label, disabled }) => {
  const [chips, _setChips] = useState([]);

  const [value, setValue] = useState('');

  const handleChange = useCallback(
    event => {
      setValue(event.target.value);
    },
    [setValue]
  );

  const {
    input,
    meta: { active, error },
  } = useField(name, {
    subscription: {
      active: true,
      error: true,
      value: true,
    },
    isEqual,
  });

  const setChips = useCallback(
    chips => {
      console.log(chips);
      _setChips(chips);
      input.onChange(chips);
    },
    [input, _setChips]
  );

  const addToChips = useCallback(() => {
    setChips([...chips, value]);
    setValue('');
  }, [chips, value, setChips]);

  const handleKeyDown = useCallback(
    event => {
      if (['Enter', 'Tab', ','].includes(event.key) && value !== '') {
        event.preventDefault();
        addToChips();
      } else if ('Backspace' === event.key && value === '') {
        event.preventDefault();
        setChips(chips.slice(0, -1));
      } else if (disabled) {
        event.preventDefault();
      }
    },
    [setChips, chips, value, addToChips, disabled]
  );

  const handleDelete = useCallback(
    idx => () => {
      setChips([...chips.slice(0, idx), ...chips.slice(idx + 1)]);
    },
    [setChips, chips]
  );

  const handleBlur = useCallback(
    e => {
      if (value !== '') {
        addToChips();
        input.onBlur();
      }
    },
    [addToChips, value, input]
  );

  const hasError = hasErrors(error);

  return (
    <Flex col className={className}>
      {label && (
        <Flex.Item as="label" className={cn('f6 lh-tall')} htmlFor={name}>
          {label}
        </Flex.Item>
      )}
      <Flex.Item
        className={cn('flex b1 flex-wrap', {
          'b-green2': active && !disabled && !hasError,
          'b-red3': active && !disabled && hasError,
        })}>
        {chips.map((chip, idx) => (
          <Chip
            key={idx}
            value={chip}
            disabled={disabled}
            onDelete={handleDelete(idx)}
          />
        ))}

        <input
          type="textarea"
          className="mv1 mh2 h7 b-none flex-grow"
          placeholder="Enter an email address"
          value={value}
          name={name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </Flex.Item>
      {error && (
        <Flex.Item as={ErrorText} className="mv1">
          {error}
        </Flex.Item>
      )}
    </Flex>
  );
};

export default EmailChipInput;
