import React, { useEffect, useState } from 'react';
import { Just } from 'folktale/maybe';

import MaybeSigil from './MaybeSigil';

const selectColorway = (valid, error, active) => {
  if (valid) {
    return ['#2AA779', '#FFFFFF'];
  }

  if (active) {
    return ['#4330FC', '#FFFFFF'];
  }

  if (error) {
    return ['#F8C134', '#FFFFFF'];
  }

  return ['#7F7F7F', '#FFFFFF'];
};

export default function InputSigil({
  className,
  patp,
  size,
  valid,
  error,
  active,
  ...rest
}) {
  const [lastValidPatp, setLastValidPatp] = useState(patp);

  useEffect(() => {
    if (valid) {
      setLastValidPatp(patp);
    }
  }, [patp, valid]);

  return (
    <MaybeSigil
      patp={Just(lastValidPatp)}
      size={size}
      colors={selectColorway(valid, error, active)}
      {...rest}
    />
  );
}
