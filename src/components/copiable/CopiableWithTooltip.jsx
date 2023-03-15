import React from 'react';

import useCopiable from 'lib/useCopiable';
import WithTooltip, { TooltipPosition } from 'components/WithTooltip';
import { Icon } from '@tlon/indigo-react';

export default function CopiableWithTooltip({
  as: As = 'span',
  text,
  children = null,
  className,
  position = TooltipPosition.Top,
  ...rest
}) {
  const [doCopy, didCopy] = useCopiable(text || children);

  return (
    <As className={className} {...rest}>
      {children}
      <WithTooltip position={position} content={didCopy ? 'Copied!' : 'Copy'}>
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
