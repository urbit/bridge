import React from 'react';
import cn from 'classnames';
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
              className={cn('f5 pv3 rel', {
                pointer: !option.disabled,
                gray3: option.disabled,
              })}
              onClick={
                option.disabled
                  ? null
                  : () => onTabChange(isActive ? undefined : option.value)
              }>
              {option.text}
              {option.disabled && (
                <sup className="f6 lowercase">{option.disabled}</sup>
              )}
              <div
                className="abs"
                style={{
                  top: 0,
                  right: 0,
                  height: '100%',
                  width: '44px',
                  overflow: 'hidden',
                }}>
                <AccessoryIcon
                  className={cn({
                    black: !option.disabled,
                  })}>
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
