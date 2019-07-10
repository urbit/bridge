import React from 'react';
import { Button } from 'indigo-react';

// NOTE: the -> is correct because inter recognizes the pair
export const ForwardButton = props => <Button accessory="->" {...props} />;
export const DownloadButton = props => <Button accessory="↓" {...props} />;
export const RestartButton = props => <Button accessory="↺" solid {...props} />;
export const GenerateButton = props => (
  <Button accessory="○" solid {...props} />
);
export const OutButton = props => (
  <Button as="a" target="_blank" accessory="↗" {...props} />
);

export const OfflineButton = props => (
  <OutButton {...props} href="https://github.com/urbit/bridge/releases">
    Offline
  </OutButton>
);
