import React from 'react';
import * as ob from 'urbit-ob';

import Sigil from './Sigil';
import AspectRatio from './AspectRatio';

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
  const colorway = selectColorway(pass, error, focused);
  const valid = ob.isValidPatp(patp);

  return valid ? (
    <Sigil patp={patp} size={size} colorway={colorway} margin={0} {...rest} />
  ) : (
    <AspectRatio aspectRatio={1} />
  );
}
