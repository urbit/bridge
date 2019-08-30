import React, { useCallback } from 'react';
import cn from 'classnames';
import * as ob from 'urbit-ob';
import { Grid, H4, Text, LinkButton } from 'indigo-react';

import useWasGreeted from 'lib/useWasGreeted';

const TEXT_STYLE = 'f5';

export default function ActivateDisclaimer({ point }) {
  const [wasGreeted, setWasGreeted] = useWasGreeted();

  const pointName = ob.patp(point);

  const dismiss = useCallback(async () => {
    setWasGreeted(true);
  }, [setWasGreeted]);

  return (
    !wasGreeted && (
      <Grid gap={4} className="mb10">
        <Grid.Item as={H4} full>
          Welcome
        </Grid.Item>
        <Grid.Item full>
          <Text className={cn(TEXT_STYLE, 'block mb4')}>
            Hi <code>{pointName}</code>,
          </Text>

          <Text className={cn(TEXT_STYLE, 'block mb4')}>
            Yes, <code>{pointName}</code> is your name here. It's good to meet
            you. As of this very moment, you own a digital identity that you can
            keep for the rest of your life.
          </Text>

          <Text className={cn(TEXT_STYLE, 'block mb4')}>
            Welcome to Azimuth. We hope you like it.
          </Text>

          <Text className={cn(TEXT_STYLE, 'block mb4')}>
            Get started by booting and exploring Arvo, our full operating system
            (still in early stages!)
          </Text>
        </Grid.Item>
        <Grid.Item full as={LinkButton} onClick={dismiss}>
          Dismiss
        </Grid.Item>
      </Grid>
    )
  );
}
