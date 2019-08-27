import React from 'react';
import cn from 'classnames';
import Tooltip from 'react-simple-tooltip';
import { ReactComponent as Copy } from 'assets/copy.svg';

import useCopiable from 'lib/useCopiable';

export default function CopiableWithTooltip({
  as: As = 'span',
  text,
  children,
  className,
  ...rest
}) {
  const [doCopy, didCopy] = useCopiable(text || children);

  return (
    <As className={cn(className, 'nowrap')} {...rest}>
      {children}
      <Tooltip
        content={didCopy ? 'Copied!' : 'Copy'}
        customCss={{ whitespace: 'nowrap' }}>
        <Copy
          style={{ height: '1em', width: '1em' }}
          className="ml1 pointer"
          onClick={doCopy}
        />
      </Tooltip>
    </As>
  );
}
