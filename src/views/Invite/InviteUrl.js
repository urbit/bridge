import React, { useCallback } from 'react';
import { Grid, Button } from 'indigo-react';

import { ForwardButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';

export default function InviteUrl({ names, push }) {
  const pushEmail = useCallback(() => push(names.EMAIL), [push, names]);

  return (
    <>
      <Grid className="mt3">
        <Grid.Divider />
        <Grid.Item
          as={Button}
          detail="Generate a URL to send to one guest"
          full
          disabled>
          Generate Invite
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          as={ForwardButton}
          onClick={pushEmail}
          detail="Send invitation to your guest's email"
          full>
          Send Invite via Email
        </Grid.Item>
      </Grid>
      <FooterButton detail="i.e. Ethereum Address, Text File" disabled>
        Advanced
      </FooterButton>
    </>
  );
}
