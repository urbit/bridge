import React, { useEffect, useState } from 'react';
import { Just } from 'folktale/maybe';
import * as ob from 'urbit-ob';

import MaybeSigil from './MaybeSigil';

const selectColorway = (pass, fail, focused) => {
  if (pass) {
    return ['#2AA779', '#FFFFFF'];
  }

  if (focused) {
    return ['#4330FC', '#FFFFFF'];
  }

  if (fail) {
    return ['#F8C134', '#FFFFFF'];
  }

  return ['#7F7F7F', '#FFFFFF'];
};

export default function InputSigil({
  className,
  patp,
  size,
  pass,
  error,
  focused,
  ...rest
}) {
  const [lastValidPatp, setLastValidPatp] = useState(patp);

  useEffect(() => {
    if (ob.isValidPatp(patp)) {
      setLastValidPatp(patp);
    }
  }, [patp]);

  return (
    <MaybeSigil
      patp={Just(lastValidPatp)}
      size={size}
      colors={selectColorway(pass, error, focused)}
      {...rest}
    />
  );
}
