import React from 'react';
import PaperCollateralRenderer from 'PaperCollateralRenderer';

export default function PaperRenderer({ point, wallet, callback, ...props }) {
  return (
    <PaperCollateralRenderer
      wallet={{ [point]: wallet }}
      callback={callback}
      className="super-hidden"
      mode="REGISTRATION"
    />
  );
}
