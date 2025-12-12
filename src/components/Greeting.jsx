import React, { useCallback } from 'react';
import cn from 'classnames';
import ob from 'urbit-ob';
import { Grid, Text, LinkButton } from 'indigo-react';

import {
  Box,
  Button,
  Checkbox,
  Icon,
  RadioButton,
  Row,
} from '@tlon/indigo-react';

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
          As of this moment, you own a piece of Urbit.
          Keep your login details safe. No one can recover them for you.
        </Text>
        <Text className={cn(TEXT_STYLE, 'block mb2')}>Now that you own your identity, the next step is to run your own operating system:</Text>
      </Grid.Item>

      <Grid.Item full>
        <Box className="info-list">
          <Row className="info-row">
            <Box className="info-message">
              Comfortable with a command line?
              <br></br>
              <a
                style={{ fontWeight: 600 }}
                className="underline"
                target="_blank"
                rel="noreferrer"
                href="https://docs.urbit.org/get-on-urbit#get-the-urbit-runtime">
                Run it using Vere↗
              </a>
            </Box>
          </Row>
          <Row className="info-row">
            <Box className="info-message">
              Graphical interfaces more your speed?

              <br></br>
              <a
                style={{ fontWeight: 600 }}
                className="underline"
                target="_blank"
                rel="noreferrer"
                href="https://nativeplanet.io/software">
                Check out Groundseg↗
              </a>
            </Box>
          </Row>
          <Row className="info-row">
            <Box className="info-message">
              Want a dedicated Urbit device to do it all for you?

              <br></br>
              <a
                style={{ fontWeight: 600 }}
                className="underline"
                target="_blank"
                rel="noreferrer"
                href="https://nativeplanet.io/hardware">
                Get Native Planet hardware↗
              </a>
            </Box>
          </Row>
          <Row className="info-row">
            <Box style={{ fontStyle: 'italic' }} className="info-message">
              Not ready to self-host? Contact <a className="bold underline" href="mailto:support@tlon.io">support@tlon.io</a> to have them host your Urbit for you!
            </Box>
          </Row>
        </Box>
      </Grid.Item>

      <Grid.Item full>
        <Text className={cn(TEXT_STYLE, 'block mb4')}>
          Welcome to Urbit. See you on the network.
        </Text>
      </Grid.Item>
      <Grid.Item full as={LinkButton} onClick={dismiss}>
        Close
      </Grid.Item>
    </Grid>
  );
}
