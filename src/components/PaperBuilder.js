import React from 'react';
import PaperRenderer from 'urbit-paper-renderer';

export default function PaperBuilder({ point, wallet, callback, ...props }) {
  return (
    <PaperRenderer
      wallet={[wallet]}
      callback={callback}
      className="super-hidden"
      show={false}
      debug={false}
    />
  );
}
