import React from 'react';
import { Button } from 'indigo-react';

// TODO: use svg icons
export const ForwardButton = props => <Button accessory="→" {...props} />;
export const DownloadButton = props => <Button accessory="⬇" {...props} />;
export const OutButton = props => (
  <Button as="a" target="_blank" accessory="↗" {...props} />
);

export const OfflineButton = props => (
  <OutButton {...props} href="https://github.com/urbit/bridge/releases">
    Offline
  </OutButton>
);
