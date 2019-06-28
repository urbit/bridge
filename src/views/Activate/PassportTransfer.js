import React, { useState, useEffect, useCallback } from 'react';
import Maybe from 'folktale/maybe';
import { Grid, H4, P, Text } from 'indigo-react';
import PaperCollateralRenderer from 'PaperCollateralRenderer';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';

import { DownloadButton, ForwardButton } from 'components/Buttons';
import Steps from 'components/Steps';

import { useActivateFlow } from './ActivateFlow';
import useLifecycle from 'lib/useLifecycle';
import WarningBox from 'components/WarningBox';
import LoadingBar from 'components/LoadingBar';

const STATUS = {
  CLAIMING: 'CLAIMING',
  NETWORKING: 'NETWORKING',
  REDIRECTING: 'REDIRECTING',
};

export default function PassportTransfer({ className }) {
  const { derivedWallet, derivedPoint, inviteWallet } = useActivateFlow();
  const [status, setStatus] = useState(STATUS.CLAIMING);
  const isClaiming = status === STATUS.CLAIMING;

  const titleText = (() => {
    switch (status) {
      case STATUS.CLAIMING:
        return 'Claiming Point';
      case STATUS.NETWORKING:
        return 'Setting Networking Keys';
      case STATUS.REDIRECTING:
        return 'Transporting to Bridge';
      default:
        break;
    }
  })();

  useLifecycle(() => {
    // on mount, start transactions
  });

  return (
    <Grid gap={4} className={className}>
      <Grid.Item full as={Steps} num={2} total={3} />
      <Grid.Item full as={H4}>
        {titleText}
      </Grid.Item>
      <Grid.Item full as={LoadingBar} progress={0.5} />
      <Grid.Item full as={Text} className="green4">
        This process can take up to 5 minutes to complete. Don't leave this page
        until the process is complete.
      </Grid.Item>

      {isClaiming && (
        <Grid.Item full as={WarningBox}>
          Never give your Master Ticket to anyone
        </Grid.Item>
      )}
    </Grid>
  );
}
