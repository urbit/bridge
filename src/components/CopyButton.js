import React from 'react';
import cn from 'classnames';
import { LinkButton } from 'indigo-react';

import useCopiable from 'lib/useCopiable';

const renderDefaultCopyText = didCopy => (didCopy ? 'Copied!' : 'Copy');

export default function CopyButton({
  as: As = LinkButton,
  text,
  children = renderDefaultCopyText,
  className,
  ...rest
}) {
  const [doCopy, didCopy] = useCopiable(text);

  return (
    <As
      onClick={doCopy}
      className={cn(className, {
        black: !didCopy,
        green3: didCopy,
      })}
      {...rest}>
      {children(didCopy)}
    </As>
  );
}
