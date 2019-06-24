import React from 'react';
import HorizontalSelector from './old/HorizontalSelector';

export default function Tabs({
  tabViews,
  tabOptions,
  currentTab,
  onTabChange,
  ...rest
}) {
  const Component = tabViews[currentTab];
  return (
    <>
      <HorizontalSelector options={tabOptions} onChange={onTabChange} />
      <Component {...rest} />
    </>
  );
}
