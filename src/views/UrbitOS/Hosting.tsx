import { useCallback, useMemo } from 'react';
import { Grid, SelectInput, Flex } from 'indigo-react';

import { CopyButtonWide } from 'components/CopyButton';
import { ForwardButton } from 'components/Buttons';
import { useHosting } from 'store/hosting';
import DownloadKeyfileButton from 'components/DownloadKeyfileButton';
import LoginButton from 'components/LoginButton';
import ProgressButton from 'components/ProgressButton';
import useCurrentPointName from 'lib/useCurrentPointName';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';
import useLifecycle from 'lib/useLifecycle';
import useLocalHosting from 'lib/useLocalHosting';
import BridgeForm from 'form/BridgeForm';

export function Hosting({ manualNetworkSeed }) {
  const bind = useKeyfileGenerator(manualNetworkSeed);
  const { keyfile, code } = bind;
  const ship = useHosting();

  const {
    syncStatus,
    url,
    unknown,
    bootProgress,
    bootMessage,
    disabled,
  } = ship;

  const { running: localRunning, url: localUrl } = useLocalHosting();

  let running = useMemo(() => localRunning || ship.running, [
    ship,
    localRunning,
  ]);

  useLifecycle(() => {
    syncStatus();
  });

  const createShip = useCallback(() => ship.create(keyfile), [keyfile, ship]);

  const name = useCurrentPointName();
  const options = [{ text: 'Tlon', value: 'tlon' }];

  const renderMain = useCallback(() => {
    if (localRunning) {
      return (
        <Grid.Item
          full
          as={LoginButton}
          solid
          success
          url={localUrl}
          code={code}>
          Open OS
        </Grid.Item>
      );
    }
    if (ship.running) {
      return (
        <>
          <Grid.Item
            cols={[1, 9]}
            as={LoginButton}
            solid
            success
            url={url}
            code={code}>
            Open OS
          </Grid.Item>
          {/* Unsupported for now */}
          {/* <Grid.Item cols={[9, 13]} as={Button} className="b-black b1" center> */}
          {/*   Disconnect */}
          {/* </Grid.Item> */}
        </>
      );
    }
    if (ship.missing) {
      return (
        <Grid.Item
          full
          as={ForwardButton}
          solid
          disabled={!keyfile}
          onClick={createShip}>
          Connect
        </Grid.Item>
      );
    }
    if (ship.pending) {
      return (
        <Grid.Item
          full
          as={ProgressButton}
          success
          disabled
          progress={bootProgress}>
          {bootMessage || 'Connecting'}
        </Grid.Item>
      );
    }
  }, [
    localRunning,
    ship.running,
    ship.missing,
    ship.pending,
    localUrl,
    code,
    url,
    keyfile,
    createShip,
    bootProgress,
    bootMessage,
  ]);

  const renderDetails = useCallback(() => {
    if (ship.running) {
      return (
        <>
          <Grid.Item cols={[1, 9]} className="gray4">
            <span className="mono">{name}</span> is connected to Tlon
          </Grid.Item>
        </>
      );
    }
    if (!keyfile && ship.missing) {
      return (
        <Grid.Item full className="gray4">
          Please reset your networking keys in order to use hosting
        </Grid.Item>
      );
    }
  }, [name, ship, keyfile]);

  return (
    <>
      {disabled && (
        <Grid gap={4}>
          <Grid.Item full className="f5">
            Urbit OS
          </Grid.Item>
          <Grid.Divider />
        </Grid>
      )}
      {!disabled && (
        <Grid gap={4}>
          <Grid.Item full className="f5" as={Flex}>
            <Flex.Item>Urbit OS </Flex.Item>
            <Flex.Item
              className={cn({ green3: running, gray4: !running }, 'ml3')}>
              {running ? 'Connected' : 'Disconnected'}
            </Flex.Item>
          </Grid.Item>
          <BridgeForm initialValues={{ provider: 'tlon' }}>
            {() => (
              <>
                {renderDetails()}
                {renderMain()}
                {!localRunning && (
                  <Grid.Item
                    full
                    as={SelectInput}
                    name="provider"
                    label="Host Provider"
                    options={options}
                    disabled
                  />
                )}
              </>
            )}
          </BridgeForm>
        </Grid>
      )}
      <Grid>
        <Grid.Item
          full
          as={DownloadKeyfileButton}
          {...bind}
          className="mt2"
          detail="A keyfile authenticates your Urbit ID to Urbit OS"
        />
        <Grid.Divider />
        {code && (
          <Grid.Item full className="mt2" as={CopyButtonWide} text={code}>
            Login Code
          </Grid.Item>
        )}
      </Grid>
    </>
  );
}
