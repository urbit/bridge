import React from 'react';
import { CopyButton as BaseCopyButton } from 'components/Buttons';
import useCopiable from 'lib/useCopiable';
import WithTooltip, { TooltipPosition } from '../WithTooltip';

interface CopyButtonWideProps {
  text: string;
  children?: React.ReactNode;
  rest?: React.HTMLProps<HTMLButtonElement>;
}

export function CopyButtonWide({
  text,
  children,
  ...rest
}: CopyButtonWideProps) {
  const [doCopy, didCopy] = useCopiable(text);
  return (
    <WithTooltip
      content={didCopy ? 'Copied!' : 'Copy'}
      className={'rel full nowrap copy-button-wide'}
      position={TooltipPosition.TopRight}>
      <BaseCopyButton as="span" onClick={doCopy} text={text} {...rest}>
        {children}
      </BaseCopyButton>
    </WithTooltip>
  );
}
