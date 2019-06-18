import React from 'react';
import cn from 'classnames';

// View is a top-level component that all Views must render to inherit styling
function View({ className, ...rest }) {
  return <div className={cn('mw-1', className)} {...rest} />;
}

View.Full = function FullView({ className, ...rest }) {
  return (
    <div
      className={cn('mw-2 ph-1 ph-3-ns ph-9-md ph-10-lg', className)}
      {...rest}
    />
  );
};

export default View;
