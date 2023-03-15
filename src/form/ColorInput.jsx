import React from 'react';
import { useField } from 'react-final-form';
import cn from 'classnames';
import { Flex } from 'indigo-react';

const ColorInput = ({ name, colors, disabled = false, label, className }) => {
  const { input } = useField(name, { subscription: { value: true } });

  const isWhite = c => c.toUpperCase() === '#FFFFFF';

  return (
    <Flex col className={cn(className, 'flex-wrap mb1')}>
      <Flex.Item
        as="label"
        className={cn('f6 lh-tall', {
          black: !disabled,
          gray4: disabled,
        })}
        htmlFor={name}>
        {label}
      </Flex.Item>
      <Flex.Item as={Flex} wrap>
        {colors.map(c => (
          <Flex.Item
            as="button"
            type="button"
            key={c}
            className={cn('m0 p0 h7 w7 p2 flex flex-center', {
              'b b-black': isWhite(c),
            })}
            style={{ backgroundColor: c }}
            onClick={() => input.onChange(c)}>
            {c === input.value ? (
              <div
                className={cn(
                  { 'bg-black': isWhite(c), 'bg-white': !isWhite(c) },
                  'w2 h2 r-full'
                )}
              />
            ) : (
              <div />
            )}
          </Flex.Item>
        ))}
      </Flex.Item>
    </Flex>
  );
};

export default ColorInput;
