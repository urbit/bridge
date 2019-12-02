import { useRef } from 'react';
import { isEqual } from 'lodash';

import usePreviousValue from './usePreviousValue';

// changes the referential identity of value on deep equality change
export default function useDeepEqualReference(value) {
  const ref = useRef(value);

  // track the old value of the config set
  const prevValue = usePreviousValue(value);

  // then compare equality
  const areEqual = isEqual(value, prevValue);

  // if equality changes, give value a new identity
  if (!areEqual) {
    ref.current = value;
  }

  return ref.current;
}
