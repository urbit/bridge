import React from 'react';
import cn from 'classnames';

// View is a top-level component that all Views must render to inherit styling
function View({ className, ...rest }) {
  return <div className={cn('mw1', className)} {...rest} />;
}

View.Full = function FullView({ className, ...rest }) {
  return (
    <div className={cn('mw2 ph1 ph3-ns ph9-md ph10-lg', className)} {...rest} />
  );
};

export default View;
