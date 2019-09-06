import React from 'react';
import PaperRenderer from 'urbit-paper-renderer';

export default function PaperBuilder({ point, wallets, callback, ...props }) {
  return (
    <PaperRenderer
      wallets={wallets}
      callback={data => {
        callback(data);
      }}
      show={false}
      debug={false}
      output={'png'}
    />
  );
}
