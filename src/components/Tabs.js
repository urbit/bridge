import React from 'react';
import cn from 'classnames';
import { Grid, Flex } from 'indigo-react';

export default function Tabs({
  views,
  options,
  currentTab,
  onTabChange,
  className,
  ...rest
}) {
  const Tab = views[currentTab];

  return (
    <Grid className={className}>
      <Grid.Item full as={Flex} className="b-gray3 bb1">
        {options.map(option => {
          const isActive = option.value === currentTab;
          return (
            <Flex.Item
              key={option.value}
              onClick={() => onTabChange(option.value)}
              className={cn('f5 pv3 mr6 clickable', {
                'black b-black bb1': isActive,
                gray3: !isActive,
              })}
              style={{ marginBottom: '-1px' }}>
              {option.text}
            </Flex.Item>
          );
        })}
      </Grid.Item>
      <Grid.Item full as={Tab} className="mt6" {...rest} />
    </Grid>
  );
}
