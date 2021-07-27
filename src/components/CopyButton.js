import React from 'react';
import cn from 'classnames';
import { LinkButton } from 'indigo-react';

import { CopyButton as BaseCopyButton } from 'components/Buttons';

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

export function CopyButtonWide({ text, children, ...rest }) {
  const [doCopy, didCopy] = useCopiable(text);
  return (
    <BaseCopyButton
      as="span"
      onClick={doCopy}
      text={text}
      className={cn({
        black: !didCopy,
        green3: didCopy,
      })}
      {...rest}>
      {children}
    </BaseCopyButton>
  );
}
