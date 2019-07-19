import React from 'react';
import cn from 'classnames';
import { H5 } from 'indigo-react';

export default function ViewHeader({ children, className }) {
  return <H5 className={cn(className, 'mv4')}>{children}</H5>;
}
