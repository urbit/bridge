import { useCallback, useMemo, useState, useEffect } from 'react';

// via: https://usehooks.com/useMedia/
// NB(shrugs): we reverse the order because we want to be 'mobile first'
// and therefore want the breakpoint that is the most "specific"
export default function useMedia(queries, values, defaultValue) {
  const reverseValues = useMemo(() => values.reverse(), [values]);
  const mediaQueryLists = useMemo(
    () => queries.reverse().map(q => window.matchMedia(q)),
    [queries]
  );

  const getValue = useCallback(() => {
    const index = mediaQueryLists.findIndex(mql => mql.matches);

    return typeof reverseValues[index] !== 'undefined'
      ? reverseValues[index]
      : defaultValue;
  }, [mediaQueryLists, reverseValues, defaultValue]);

  const [value, setValue] = useState(getValue);

  useEffect(() => {
    const handler = () => setValue(getValue);
    mediaQueryLists.forEach(mql => mql.addListener(handler));

    return () => mediaQueryLists.forEach(mql => mql.removeListener(handler));
  }, [mediaQueryLists, getValue]);

  return value;
}
