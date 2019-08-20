import React from 'react';
import cn from 'classnames';
import { Flex, Breadcrumb } from 'indigo-react';

export default function Crumbs({ className, routes = [] }) {
  const lastIndex = routes.length - 1;
  const textStyle = 'gray4 mono';
  return (
    <Flex className={className} row wrap>
      {routes.map((route, i) => {
        const disabled = !route.action;

        return (
          <React.Fragment key={route.text}>
            <Flex.Item
              as={Breadcrumb}
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
