import React from 'react';
import { Button } from 'indigo-react';
import { Icon } from '@tlon/indigo-react';

import { blinkIf } from './Blinky';

// NOTE: the -> is correct because inter recognizes the pair
export const ForwardButton = ({ loading, ...props }) => (
  <Button accessory={blinkIf(loading, '->')} {...props} />
);
export const DownloadButton = ({ loading, ...props }) => (
  <Button accessory={blinkIf(loading, '↓')} {...props} />
);
export const RestartButton = props => <Button accessory="↺" {...props} />;
export const GenerateButton = ({ loading, ...props }) => (
  <Button accessory={blinkIf(loading, '○')} solid {...props} />
);
export const OutButton = props => (
  <Button as="a" target="_blank" accessory="↗" {...props} />
);

export const OfflineButton = props => (
  <OutButton {...props} href="https://github.com/urbit/bridge/releases">
    Offline
  </OutButton>
);

export const CopyButton = props => (
  <Button
    accessory={<Icon icon="Copy" size="18px" color={'black'} />}
    {...props}
  />
);
