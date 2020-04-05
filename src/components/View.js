import React, { useCallback } from 'react';
import cn from 'classnames';
import { Flex } from 'indigo-react';

import Footer from './Footer';
import useBreakpoints from 'lib/useBreakpoints';
import MiniBackButton from './MiniBackButton';
import { useHistory } from 'store/history';
import NavHeader from './NavHeader';

const EXPECT_LOGOUT_WHEN_POPPING_AT_DEPTH = 2;

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
    pt7: shouldInset,
    pt5: !shouldInset,
  });

  const goBack = useCallback(() => pop(), [pop]);

  const goLogout = useCallback(() => pop(size - 1), [pop, size]);

  const showBackButton = size > 1 && !!pop;
  const backIsLogout = size === EXPECT_LOGOUT_WHEN_POPPING_AT_DEPTH;

  const Header = useCallback(
    ({ logout }) => {
      return showBackButton ? (
        <Flex.Item
          as={Flex}
          className={cn(insetPadding, 'flex-row-r justify-between pb5')}>
          <Flex.Item
            onClick={goLogout}
            as="a"
            className="f5 gray4 underline mr2 pointer">
            Logout
          </Flex.Item>
          <Flex.Item as={NavHeader.Target} />
        </Flex.Item>
      ) : (
        <Flex.Item className={insetPadding} as={NavHeader.Target} />
      );
    },
    [goLogout, insetPadding, showBackButton]
  );

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
      <Flex.Item as={Flex} col className={cn(insetPadding)}>
        {showBackButton && !backIsLogout && (
          <MiniBackButton
            hpadding={!isMobile}
            vpadding={isMobile}
            isExit={backIsLogout}
            onClick={goBack}
          />
        )}
      </Flex.Item>

      <Flex.Item flex={1} as={Flex} col justify="between">
        <Flex.Item className="pb5 ">
          <Header logout={goBack} />
          {children}
        </Flex.Item>
        <Flex.Item as={Footer.Target} />
      </Flex.Item>

      <Flex.Item style={{ visibility: 'hidden' }}>
        {showBackButton && !backIsLogout && <MiniBackButton />}
      </Flex.Item>
    </Flex>
  );
}

// View.Full is sugar for <View full /> to help with readability
View.Full = function FullView(props) {
  return <View full {...props} />;
};

export default View;
