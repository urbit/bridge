import React from 'react';
import { ReactComponent as Copy } from 'assets/copy.svg';

import useCopiable from 'lib/useCopiable';
import WithTooltip from 'components/WithTooltip';
import { Icon } from '@tlon/indigo-react';

export default function CopiableWithTooltip({
  as: As = 'span',
  text,
  children,
  className,
  ...rest
}) {
  const [doCopy, didCopy] = useCopiable(text || children);

  return (
    <As className={className} {...rest}>
      {children}
      <WithTooltip content={didCopy ? 'Copied!' : 'Copy'}>
        <Icon
          icon="Copy"
          style={{ height: '1em', width: '1em' }}
          className="ml1 pointer"
          onClick={doCopy}
        />
      </WithTooltip>
    </As>
  );
}
