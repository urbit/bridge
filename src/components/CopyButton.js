import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LinkButton } from 'indigo-react';
import cn from 'classnames';
import copy from 'copy-to-clipboard';

const COPY_DELAY = 2 * 1000; // ms
const renderDefaultCopyText = didCopy => (didCopy ? 'Copied!' : 'Copy');

export default function CopyButton({
  as: As = LinkButton,
  text,
  children = renderDefaultCopyText,
  className,
  ...rest
}) {
  const [didCopy, setDidCopy] = useState(false);

  // what we really want here is a useDebouncedCallback from use-debounced
  // but that's a relatively large dep for a single simple usage so ¯\_(ツ)_/¯
  const listener = useRef(); // <NodeJS.Listener>
  useEffect(() => () => clearTimeout(listener.current), []);

  const doCopy = useCallback(() => {
    copy(text);
    setDidCopy(true);

    clearTimeout(listener.current);
    listener.current = setTimeout(() => setDidCopy(false), COPY_DELAY);
  }, [text]);

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
