import React, { useState, useCallback } from 'react';
import { Flex, ErrorText } from 'indigo-react';
import cn from 'classnames';
import { useField } from 'react-final-form';

import { hasErrors } from 'form/validators';

const Chip = ({ value, onDelete }) => {
  return (
    <Flex className="r32 ph2 m1 flex-center h7 bg-gray2">
      <Flex.Item>{value}</Flex.Item>
      <Flex.Item onClick={onDelete} className="ml1 f6">
        ✗
      </Flex.Item>
    </Flex>
  );
};

const EmailChipInput = ({ className, name, label }) => {
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
    subscription: { active: true, error: true },
  });

  const setChips = useCallback(
    chips => {
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
      }
    },
    [setChips, chips, value]
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
        input.handleBlur();
      }
    },
    [addToChips, value]
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
          'b-green2': active && !hasError,
          'b-red3': active && hasError,
        })}>
        {chips.map((chip, idx) => (
          <Chip key={idx} value={chip} onDelete={handleDelete(idx)} />
        ))}

        <input
          type="textarea"
          className="mv1 mh2 h7 b-none flex-grow"
          placeholder="Enter an email address"
          value={value}
          name={name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={input.onFocus}
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
