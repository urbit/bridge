import React, { useEffect, useCallback } from 'react';
import { Grid, ErrorText } from 'indigo-react';

import cn from 'classnames';

import { useHosting } from 'store/hosting';

import BridgeForm from 'form/BridgeForm';

import { GenerateButton, ForwardButton } from './Buttons';

import 'style/hosted-ship.scss';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';

export default function HostedShip({
  // useHostedShip

  // additional from parent
  className,
}) {
  const ship = useHosting();
  const { syncStatus } = ship;
  console.log(ship);

  const { keyfile } = useKeyfileGenerator();

  const createShip = useCallback(() => ship.create(keyfile), [ship, keyfile]);

  const renderStatus = () => {
    if (ship.missing || ship.booting) {
      return (
        <Grid.Item
          full
          as={GenerateButton}
          solid
          success
          disabled={ship.booting}
          loading={ship.booting}
          onClick={createShip}>
          Boot Urbit OS
        </Grid.Item>
      );
    } else if (ship.running || ship.connecting) {
      return (
        <Grid.Item
          full
          as={ForwardButton}
          solid
          success
          disabled={ship.connecting}
          loading={ship.connecting}
          onClick={ship.getEvents}>
          Connect
        </Grid.Item>
      );
    } else if (ship.connected) {
      return (
        <Grid.Item
          full
          as={GenerateButton}
          solid
          success
          onClick={ship.getStatus}>
          Disconnect
        </Grid.Item>
      );
    } else if (ship.unknown || ship.querying) {
      return (
        <Grid.Item
          full
          as={GenerateButton}
          accessory={ship.error ? '↺' : '->'}
          solid
          success
          disabled={ship.querying}
          loading={ship.querying}
          onClick={syncStatus}>
          Query
        </Grid.Item>
      );
    }
  };

  const renderEvents = (title, detail, events) => {
    return (
      <>
        <Grid.Item
          full
          as={ForwardButton}
          accessory=""
          disabled
          detail={detail}>
          {title}
        </Grid.Item>
        <Grid.Item full>
          <ul className="hosting-events">
            {events.length === 0 && <li>&lt;Waiting&gt;</li>}
            {events.map(event => (
              <li>{event}</li>
            ))}
          </ul>
        </Grid.Item>
      </>
    );
  };

  return (
    <>
      <Grid className={cn(className, 'mt1')}>
        <BridgeForm>
          {() => (
            <>
              {ship.error && (
                <Grid.Item full as={ErrorText} className="mv1">
                  {ship.error.message}
                </Grid.Item>
              )}
              {renderStatus()}
              {!ship.unknown && (
                <Grid.Item
                  full
                  as={ForwardButton}
                  accessory=""
                  disabled
                  detail={ship.state}
                  detailClassName="mono">
                  Ship Status
                </Grid.Item>
              )}
            </>
          )}
        </BridgeForm>

        {ship.connected && (
          <>
            <Grid.Divider />
            {renderEvents('Run', 'Terminal events', ship.runEvents)}
            {renderEvents(
              'New',
              'Pier creation and boot events',
              ship.newEvents
            )}
            {renderEvents(
              'Sys',
              'Hosting platform events',
              ship.sysEvents.map(e => e.object.message)
            )}
          </>
        )}
      </Grid>
    </>
  );
}
