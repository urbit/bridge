import React, { useCallback } from 'react';
import cn from 'classnames';
import { Flex } from 'indigo-react';

import { FooterTarget } from './Footer';
import useBreakpoints from 'lib/useBreakpoints';
import { MiniBackButton } from './MiniBackButton';
import { useHistory } from 'store/history';
import { NavHeaderTarget } from './NavHeader';
import { noop } from 'lodash';

interface ViewProps {
  className?: string;
  children: React.ReactNode;
  inset?: boolean;
  full?: boolean;
  hideBack?: boolean;
  pop?: VoidFunction;
  header?: React.ReactNode;
  centered?: boolean;
  id?: string;
  rest?: React.HTMLAttributes<HTMLDivElement>;
}

// View is a top-level component that all Views must render to inherit styling
function View({
  className,
  children,
  inset = false,
  full = false,
  hideBack = false,
  pop = noop,
  header = React.Fragment,
  id,
  centered = false,
  ...rest
}: ViewProps) {
  const { reset }: any = useHistory();
  const isMobile: boolean = useBreakpoints([true, false, false]);
  const shouldInset = inset && !isMobile;

  const insetPadding = cn({
    pt7: shouldInset,
    pt5: !shouldInset,
  });

  const goBack = useCallback(() => pop(), [pop]);

  const goLogout = reset;

  const showBackButton = !!pop;

  const Header = useCallback(
    ({ logout }) => {
      return showBackButton ? (
        <Flex.Item
          as={Flex}
          className={cn(
            insetPadding,
            'flex-row-r justify-between pb5 align-center'
          )}>
          <Flex.Item
            onClick={goLogout}
            as="a"
            className="f5 gray4 underline mr2 pointer">
            Logout
          </Flex.Item>
          <Flex.Item as={NavHeaderTarget} />
        </Flex.Item>
      ) : (
        <Flex.Item className={insetPadding} as={NavHeaderTarget} />
      );
    },
    [goLogout, insetPadding, showBackButton]
  );

  return (
    <Flex
      row={!isMobile}
      col={isMobile}
      justify="between"
      id={id}
      className={cn(
        'minh-100 ph4',
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
        {showBackButton && !hideBack && (
          <MiniBackButton
            hpadding={!isMobile}
            vpadding={isMobile}
            onClick={goBack}
            className="mt1"
          />
        )}
      </Flex.Item>

      <Flex.Item
        flex={1}
        as={Flex}
        col
        className={cn({
          'justify-between': !centered,
          'justify-center': centered,
        })}>
        <Flex.Item className="pb5 ">
          {header || <Header logout={goBack} />}
          {children}
        </Flex.Item>
        <Flex.Item as={FooterTarget} />
      </Flex.Item>

      <Flex.Item style={{ width: '48px' }} />
    </Flex>
  );
}

// View.Full is sugar for <View full /> to help with readability
View.Full = function FullView(props: ViewProps) {
  return <View full {...props} />;
};

export default View;
