import React, { useCallback } from 'react';
import cn from 'classnames';
import ob from 'urbit-ob';
import { Grid, Text, LinkButton } from 'indigo-react';

import useWasGreeted from 'lib/useWasGreeted';

const TEXT_STYLE = 'f5';

export default function ActivateDisclaimer({ point }) {
  const [wasGreeted, setWasGreeted] = useWasGreeted();

  const pointName = ob.patp(point);

  const dismiss = useCallback(async () => {
    setWasGreeted(true);
  }, [setWasGreeted]);

  if (wasGreeted) {
    return null;
  }

  return (
    <Grid gap={4} className="mb10">
      <Grid.Item full>
        <Text className={cn(TEXT_STYLE, 'block mb4')}>
          Welcome <span className="mono">{pointName}</span>,
        </Text>

        <Text className={cn(TEXT_STYLE, 'block mb2')}>
          As of this moment, you own a piece of Urbit. No one can take it from
          you, and you can keep it for the rest of your life.
        </Text>
        <Text className={cn(TEXT_STYLE, 'block mb2')}>
          Keep your Master Ticket safe. No one can recover it for you. But it
          can get you back into Urbit at any time.
        </Text>
        <Text className={cn(TEXT_STYLE, 'block mb2')}>Right now you can:</Text>
      </Grid.Item>

      <Grid.Item full as={LinkButton} href="https://docs.urbit.org/manual/getting-started">
        <Text className={cn(TEXT_STYLE, 'block mb2')}>
          Boot Arvo, the Urbit OS
        </Text>
      </Grid.Item>

      <Grid.Item full>
        <Text className={cn(TEXT_STYLE, 'block mb4')}>
          Welcome to Urbit. See you online.
        </Text>
      </Grid.Item>
      <Grid.Item full as={LinkButton} onClick={dismiss}>
        Close
      </Grid.Item>
    </Grid>
  );
}
