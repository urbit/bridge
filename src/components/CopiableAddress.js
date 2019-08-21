import React from 'react';
import cn from 'classnames';

import useCopiable from 'lib/useCopiable';

export default function CopiableAddress({
  as: As = 'span',
  children,
  className,
}) {
  const [doCopy, didCopy] = useCopiable(children);

  return (
    <As
      onClick={doCopy}
      className={cn(className, 'mono', {
        pointer: !didCopy,
        green3: didCopy,
      })}>
      {children}
    </As>
  );
}
