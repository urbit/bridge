import { useState, useEffect, useRef, useCallback } from 'react';
import copy from 'copy-to-clipboard';

const COPY_DELAY = 2 * 1000; // ms

export default function useCopiable(text: string): [doCopy: VoidFunction, didCopy: boolean] {
  const [didCopy, setDidCopy] = useState<boolean>(false);

  // what we really want here is a useDebouncedCallback from use-debounced
  // but that's a relatively large dep for a single simple usage so ¯\_(ツ)_/¯
  const listener = useRef<ReturnType<typeof window.setTimeout>>(); // <NodeJS.Listener>
  useEffect(() => () => clearTimeout(Number(listener.current)), []);

  const doCopy = useCallback(() => {
    copy(text);
    setDidCopy(true);

    clearTimeout(Number(listener.current));
    listener.current = setTimeout(() => setDidCopy(false), COPY_DELAY);
  }, [text]);

  return [doCopy, didCopy];
}
