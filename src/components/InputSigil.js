import React from 'react';
import * as ob from 'urbit-ob';

import Sigil from './Sigil';

const selectColorway = (pass, fail, focused) => {
  if (pass) {
    return ['#FFFFFF', '#2AA779'];
  }

  if (focused) {
    return ['#FFFFFF', '#4330FC'];
  }

  if (fail) {
    return ['#FFFFFF', '#F8C134'];
  }

  return ['#FFFFFF', '#7F7F7F'];
};

export default function ValidatedSigil({
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

  return (
    <div className={className}>
      {valid ? (
        <Sigil patp={patp} size={size} colorway={colorway} {...rest} />
      ) : (
        <div
          className="bg-transparent"
          style={{
            width: size,
            height: size,
          }}
        />
      )}
    </div>
  );
}
