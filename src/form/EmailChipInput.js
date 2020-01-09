import React, { useState, useCallback } from 'react';
import { Flex, ErrorText } from 'indigo-react';
import cn from 'classnames';
import { useField } from 'react-final-form';
import { useFieldArray } from 'react-final-form-arrays';

import { hasErrors } from 'form/validators';

const Chip = ({ onDelete, disabled, name }) => {
  const { input } = useField(name, { subscription: { value: true } });
  return (
    <Flex
      className={cn('r32 ph2 m1 flex-center h7', {
        'bg-gray2': !disabled,
        'bg-gray1 gray4': disabled,
      })}>
      <Flex.Item>{input.value}</Flex.Item>
      <Flex.Item
        onClick={disabled ? undefined : onDelete}
        className="ml1 f6 pointer-hover">
        ✗
      </Flex.Item>
    </Flex>
  );
};

const EmailChipInput = ({ className, name, label, disabled }) => {
  const {
    fields,
    meta: { error, active },
  } = useFieldArray(name, { subscription: { error: true, active: true } });

  const [value, setValue] = useState('');

  const handleChange = useCallback(
    event => {
      event.preventDefault();
      setValue(event.target.value);
    },
    [setValue]
  );

  const addToChips = useCallback(() => {
    fields.push(value);
    setValue('');
  }, [value, fields, setValue]);

  const handleKeyDown = useCallback(
    event => {
      if (['Enter', 'Tab', ',', ' '].includes(event.key) && value !== '') {
        event.preventDefault();
        addToChips();
      } else if ('Backspace' === event.key && value === '') {
        event.preventDefault();
        fields.pop();
      } else if (disabled) {
        event.preventDefault();
      }
    },
    [fields, value, disabled, addToChips]
  );

  const handleDelete = useCallback(
    idx => () => {
      fields.remove(idx);
    },
    [fields]
  );

  const handleBlur = useCallback(
    e => {
      e.preventDefault();
      if (value !== '') {
        addToChips();
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
          'b-green2': active && !disabled && !hasError,
          'b-red3': active && !disabled && hasError,
        })}>
        {fields.map((name, idx) => (
          <Chip
            key={idx}
            name={name}
            disabled={disabled}
            onDelete={handleDelete(idx)}
          />
        ))}

        <input
          type="textarea"
          className="mv1 mh2 h7 b-none flex-grow"
          placeholder="Enter an email address"
          value={value}
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
