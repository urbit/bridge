import React, { useCallback } from 'react';
import { Grid, Button } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import useInvites from 'lib/useInvites';

import { ForwardButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';

export default function InviteUrl() {
  const { names, push } = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const point = need.pointCursor(pointCursor);
  const { availableInvites } = useInvites(point);
  const canInvite = availableInvites.matchWith({
    Nothing: () => false,
    Just: p => p.value > 0,
  });

  const pushEmail = useCallback(() => push(names.EMAIL), [push, names]);

  return (
    <>
      <Grid className="mt3">
        <Grid.Divider />
        <Grid.Item
          as={Button}
          detail="Generate a URL to send to one guest"
          full
          disabled={!canInvite || true}>
          Generate Invite
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          as={ForwardButton}
          onClick={pushEmail}
          detail="Send invitation to your guest's email"
          disabled={!canInvite}
          full>
          Send Invite via Email
        </Grid.Item>
      </Grid>
      <FooterButton
        detail="i.e. Ethereum Address, Text File"
        disabled={!canInvite || true}>
        Advanced
      </FooterButton>
    </>
  );
}
