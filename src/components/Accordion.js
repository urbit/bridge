import React from 'react';
import { Grid, AccessoryIcon } from 'indigo-react';

export default function Accordion({
  className,
  views,
  options,
  currentTab,
  onTabChange,

  // Tab props
  ...rest
}) {
  const Tab = views[currentTab];

  return (
    <Grid className={className}>
      {options.map((option, i) => {
        const isActive = option.value === currentTab;

        return (
          <React.Fragment key={option.value}>
            <Grid.Item
              full
              className="f5 pv3 rel clickable"
              onClick={() => onTabChange(isActive ? undefined : option.value)}>
              {option.text}
              <div
                className="abs"
                style={{
                  top: 0,
                  right: 0,
                  height: '100%',
                  width: '44px',
                  overflow: 'hidden',
                }}>
                <AccessoryIcon className="black">
                  {isActive ? '▲' : '▼'}
                </AccessoryIcon>
              </div>
            </Grid.Item>
            {isActive && <Grid.Item full as={Tab} {...rest} />}
            <Grid.Divider />
          </React.Fragment>
        );
      })}
    </Grid>
  );
}
