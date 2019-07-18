import React from 'react';
import { sigil, reactRenderer } from 'urbit-sigil-js';

export default function Sigil({ patp, size, colorway, ...rest }) {
  return (
    <div>
      {sigil({
        patp: patp,
        renderer: reactRenderer,
        size: size,
        colors: colorway,
      })}
    </div>
  );
}
