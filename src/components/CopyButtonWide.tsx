import React from 'react';
import { CopyButton as BaseCopyButton } from 'components/Buttons';
import useCopiable from 'lib/useCopiable';

export function CopyButtonWide({ text, children, ...rest }) {
  const [doCopy, didCopy] = useCopiable(text);
  return (
    <BaseCopyButton
      as="span"
      onClick={doCopy}
      didCopy={didCopy}
      text={text}
      {...rest}>
      {children}
    </BaseCopyButton>
  );
}
