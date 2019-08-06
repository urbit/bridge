import React, { useCallback } from 'react';
import cn from 'classnames';
import { Flex } from 'indigo-react';

import Footer from './Footer';
import useBreakpoints from 'lib/useBreakpoints';
import MiniBackButton from './MiniBackButton';
import { useHistory } from 'store/history';

// View is a top-level component that all Views must render to inherit styling
function View({
  className,
  children,
  inset = false,
  full = false,
  pop,
  ...rest
}) {
  const { size } = useHistory();
  const isMobile = useBreakpoints([true, false, false]);
  const shouldInset = inset && !isMobile;

  const insetPadding = cn({
    pt10: shouldInset,
    pt5: !shouldInset,
  });

  const goBack = useCallback(() => pop(), [pop]);

  const showBackButton = size > 1 && !!pop;

  return (
    <Flex
      row={!isMobile}
      col={isMobile}
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
      <Flex.Item
        as={Flex}
        col
        style={{ width: '48px' }}
        className={cn(insetPadding)}>
        {showBackButton && (
          <MiniBackButton
            hpadding={!isMobile}
            vpadding={isMobile}
            onClick={goBack}
          />
        )}
      </Flex.Item>

      <Flex.Item flex={1} as={Flex} col justify="between">
        <Flex.Item className={cn('pb5', insetPadding)}>{children}</Flex.Item>
        <Flex.Item as={Footer.Target} />
      </Flex.Item>

      <Flex.Item style={{ width: '48px' }} />
    </Flex>
  );
}

// View.Full is sugar for <View full /> to help with readability
View.Full = function FullView(props) {
  return <View full {...props} />;
};

export default View;
