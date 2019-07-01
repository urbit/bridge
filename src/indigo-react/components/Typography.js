import React from 'react';
import cn from 'classnames';

const typeWith = (DefaultComponent, defaultClassName) =>
  function({ as: As = DefaultComponent, className, ...rest }) {
    return <As className={cn(defaultClassName, className)} {...rest} />;
  };

export const H1 = typeWith('h1');
export const H2 = typeWith('h2');
export const H3 = typeWith('h3');
export const H4 = typeWith('h4');
export const H5 = typeWith('h5');
export const H6 = typeWith('h6');
export const Caption = typeWith('caption');
export const P = typeWith('p');
export const B = typeWith('b', 'fw-bold');

export const Breadcrumb = typeWith('span', 'f6');
export const Text = typeWith('span');
export const HelpText = typeWith('span', 'f6 gray4');
export const ErrorText = typeWith('span', 'f6 red3');
