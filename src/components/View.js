import React from 'react';
import cn from 'classnames';
import { Flex } from 'indigo-react';

import Footer from './Footer';

// View is a top-level component that all Views must render to inherit styling
function View({ className, children, full = false, ...rest }) {
  return (
    <Flex
      col
      justify="between"
      className={cn(
        'minh-100 ph5',
        {
          mw1: !full,
          'mw2 ph9-md ph10-lg': full,
        },
        className
      )}
      {...rest}>
      <Flex.Item className="pv5">{children}</Flex.Item>
      <Footer.Portal />
    </Flex>
  );
}

// View.Full is sugar for <View full /> to help with readability
View.Full = function FullView(props) {
  return <View full {...props} />;
};

export default View;
