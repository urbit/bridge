import React from 'react';
import ob from 'urbit-ob';

import Sigil from './Sigil';
import AspectRatio from './AspectRatio';

/**
 * patp is Maybe<string>
 */
export default function MaybeSigil({ className, patp, size, ...rest }) {
  const validPatp = patp.matchWith({
    Nothing: () => null,
    Just: p =>
      ob.isValidPatp(p.value) && p.value.length < 15 ? p.value : null,
  });

  return validPatp ? (
    <Sigil patp={validPatp} size={size} {...rest} />
  ) : (
    <AspectRatio aspectRatio={1} />
  );
}
