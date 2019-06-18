import React from 'react';
import cn from 'classnames';

export default function({ debug = false, ...rest }) {
  return <main className={cn({ debug })} {...rest} />;
}
