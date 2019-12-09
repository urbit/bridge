import React from 'react';
import cn from 'classnames';
import { Grid, ErrorText } from 'indigo-react';

import BridgeForm from 'form/BridgeForm';

import {
  OutButton,
  RestartButton,
  GenerateButton,
  ForwardButton,
} from './Buttons';
import ProgressButton from './ProgressButton';

export default function HostedShip({
  // from useHostedShip.bind
  error,
  notFound,
  running,
  booting,
  connecting,
  connected,
  unknown,
  events,

  checkShipExists,
  getShipEvents,
  createNewShip,

  // additional from parent
  className,
}) {
  const canHost = true;

  const renderPrimarySection = () => {
    if (notFound) {
      return (
        <Grid.Item full as={GenerateButton} onClick={createNewShip} success>
          Boot Urbit OS
        </Grid.Item>
      );
    } else if (running) {
      return (
        <Grid.Item full as={ForwardButton} onClick={getShipEvents} success>
          Connect
        </Grid.Item>
      );
    } else if (connecting) {
      return (
        <Grid.Item full as={ProgressButton} success disabled>
          Connecting
        </Grid.Item>
      );
    } else if (booting) {
      return (
        <Grid.Item full as={ProgressButton} success disabled>
          Booting
        </Grid.Item>
      );
    } else {
      return (
        <Grid.Item
          full
          as={RestartButton}
          onClick={checkShipExists}
          disabled={!canHost}
          loading={!canHost && unknown}>
          Check Hosting Status
        </Grid.Item>
      );
    }
  };

  return (
    <Grid className={cn(className, 'mt1')}>
      <BridgeForm>
        {() => (
          <>
            {renderPrimarySection()}

            {error && (
              <Grid.Item full as={ErrorText} className="mv1">
                {error.message}
              </Grid.Item>
            )}

            {running && (
              <>
                <Grid.Item full as={OutButton}>
                  Redirect to Urbit OS Dojo
                </Grid.Item>
                <Grid.Divider />
              </>
            )}
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
