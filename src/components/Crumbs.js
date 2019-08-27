import React from 'react';
import cn from 'classnames';
import { Flex, Breadcrumb } from 'indigo-react';

const ButtonCrumb = props => <Breadcrumb as="button" {...props} />;

export default function Crumbs({ className, routes = [] }) {
  const lastIndex = routes.length - 1;
  const textStyle = 'button gray4 mono';
  return (
    <Flex className={className} row wrap>
      {routes.map((route, i) => {
        const disabled = !route.action;

        return (
          <React.Fragment key={route.text}>
            <Flex.Item
              as={route.action ? ButtonCrumb : Breadcrumb}
              tabIndex={route.action ? '0' : '-1'}
              onClick={route.action}
              disabled={disabled}
              className={cn(textStyle, { 'pointer underline': !disabled })}>
              {route.text}
            </Flex.Item>
            {i !== lastIndex && (
              <Flex.Item as={Breadcrumb} className={cn(textStyle, 'mh2')}>
                /
              </Flex.Item>
            )}
          </React.Fragment>
        );
      })}
    </Flex>
  );
}
