import React, { useState, useEffect, useCallback } from 'react';
import { Grid } from 'indigo-react';
import { ecliptic } from 'azimuth-js';
import * as ob from 'urbit-ob';

import {
  getHideMigrationMessage,
  storeHideMigrationMessage,
} from 'store/storage/roller';
import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { useRollerStore } from 'store/rollerStore';

import { useLocalRouter } from 'lib/LocalRouter';
import * as need from 'lib/need';
import Point, { PointField } from 'lib/types/Point';
import useRoller from 'lib/useRoller';
import { L1TxnType } from 'lib/types/PendingL1Transaction';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { DUMMY_L2_ADDRESS, GAS_LIMITS } from 'lib/constants';
import { isPlanet } from 'lib/utils/point';

import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import BodyPane from 'components/L2/Window/BodyPane';
import HeaderPane from 'components/L2/Window/HeaderPane';
import Window from 'components/L2/Window/Window';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import Dropdown from 'components/L2/Dropdowns/Dropdown';
import Sigil from 'components/Sigil';
import { ReactComponent as StarIcon } from 'assets/star.svg';

import {
  Box,
  Button,
  Checkbox,
  Icon,
  RadioButton,
  Row,
} from '@tlon/indigo-react';

import './MigrateL2.scss';

const PointEntry = ({
  point,
  select,
}: {
  point: number;
  select?: () => void;
}) => {
  if (point < 0) {
    return (
      <Row className="entry" onClick={select}>
        <Box>Select a point</Box>
      </Row>
    );
  }

  const patp = ob.patp(point);

  return (
    <Row className="entry" onClick={select}>
      <Box className="sigil">
        <Sigil patp={patp} size={1} colors={['#000000', '#FFFFFF']} />
      </Box>
      <Box className="mono">{patp}</Box>
    </Row>
  );
};

const useMigrate = () => {
  const { contracts }: any = useNetwork();
  const { syncDates }: any = usePointCache();

  const _contracts = need.contracts(contracts);

  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  return useEthereumTransaction(
    useCallback(
      (selectedPoint: number, transfer: boolean) => {
        if (selectedPoint < 0) {
          return;
        }
        setSelectedPoint(selectedPoint);
        return transfer || isPlanet(selectedPoint)
          ? ecliptic.transferPoint(
            _contracts,
            selectedPoint,
            DUMMY_L2_ADDRESS,
            false
          )
          : ecliptic.setSpawnProxy(_contracts, selectedPoint, DUMMY_L2_ADDRESS);
      },
      [_contracts]
    ),
    useCallback(() => syncDates(selectedPoint), [selectedPoint, syncDates]),
    GAS_LIMITS.DEFAULT
  );
};

export default function MigrateL2() {
  const { pop }: any = useLocalRouter();
  const { point, pointList } = useRollerStore();
  const { checkForUpdates } = useRoller();
  const l1Points = pointList.filter(({ canMigrate }) => canMigrate);

  const [proceed, setProceed] = useState(false);
  const [hideMessage, setHideMessage] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [transfer, setTransfer] = useState(true);

  const [selectedPoint, setSelectedPoint] = useState(
    point.isL1 ? point : l1Points[0]
  );
  const hideInfo = getHideMigrationMessage();

  const { construct, unconstruct, bind, completed, txHashes } = useMigrate();

  useEffect(() => {
    if (point.isGalaxy && point.isL1) {
      setTransfer(false);
      construct(point.value, false);
    } else if (point.isL1) {
      construct(point.value, transfer);
    } else {
      unconstruct();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (completed) {
      const message = transfer
        ? `${selectedPoint.patp} has been migrated to Layer 2!`
        : `${selectedPoint.patp}'s spawn proxy has been set to Layer 2!`;

      checkForUpdates({
        point: selectedPoint,
        message,
        notify: true,
        field: PointField.layer,
        l1Txn: {
          id: `${DUMMY_L2_ADDRESS}-${selectedPoint.value}`,
          point: selectedPoint.value,
          type: transfer ? L1TxnType.migrate : L1TxnType.migrateSpawn,
          hash: txHashes[0],
          time: new Date().getTime(),
        },
      });

      pop();
    }
  }, [completed, pop]); // eslint-disable-line react-hooks/exhaustive-deps

  const goBack = useCallback(() => {
    if (proceed) {
      setProceed(false);
    } else {
      pop();
    }
  }, [pop, proceed, setProceed]);

  const goProceed = useCallback(() => {
    if (hideMessage) {
      storeHideMigrationMessage();
    }

    setProceed(true);
  }, [hideMessage]);

  const selectPoint = useCallback(
    (point: Point) => {
      if (point.isPlanet || (point.isStar && point.isL2Spawn)) {
        setTransfer(true);
      } else if (point.isGalaxy) {
        setTransfer(false);
      }
      setSelectedPoint(point);
      setShowDropdown(false);
      bind.reset();
      construct(point.value, transfer);
    },
    [setSelectedPoint, setShowDropdown, bind, construct, transfer]
  );

  const toggleTransfer = useCallback(() => {
    construct(selectedPoint.value, !transfer);
    setTransfer(!transfer);
  }, [transfer, setTransfer, construct, selectedPoint]);

  const getContent = () => {
    if (l1Points.length === 0) {
      return (
        <Box className="content">
          <Box className="ship-selector">
            <Box>All of your eligible ships are already on Layer 2.</Box>
          </Box>
        </Box>
      );
    }

    const isStar = Boolean(selectedPoint?.isStar);
    const isGalaxy = Boolean(selectedPoint?.isGalaxy);

    if (proceed) {
      return (
        <Box className="content">
          <Box className="ship-selector">
            <Box>Ship</Box>
            <Box className="select-ship">Select one of your ships</Box>
            <Dropdown
              open={showDropdown}
              toggleOpen={() => setShowDropdown(!showDropdown)}
              value={<PointEntry point={selectedPoint.value} />}
              className="migrate-selector">
              {l1Points.map((p: Point) => (
                <PointEntry
                  point={p.value}
                  key={p.value}
                  select={() => selectPoint(p)}
                />
              ))}
            </Dropdown>
            {isStar && !selectedPoint?.isL2Spawn && (
              <Box className="transfer-spawn-selector">
                <Row onClick={toggleTransfer} className="transfer">
                  <RadioButton
                    color="rgba(0,0,0,0.3)"
                    className={`radio ${transfer ? 'selected' : ''}`}
                    selected={transfer}
                    name="transferType"
                  />
                  Transfer Ship
                </Row>
                <Row onClick={toggleTransfer} className="transfer">
                  <RadioButton
                    color="rgba(0,0,0,0.3)"
                    className={`radio ${!transfer ? 'selected' : ''}`}
                    selected={!transfer}
                    name="transferType"
                  />
                  Set Spawn Proxy
                </Row>
              </Box>
            )}
            {isStar && (
              <Box className="mt4">
                <div className="bold">Transferring ship</div>
                Allows you to conduct all
                transactions subsidized on Layer 2, with the tradeoff
                of lost visibility to the Ethereum network.

                <br></br>
                <br></br>
                <div className="bold">Set spawn proxy</div>
                Moves spawning functionality to Layer 2
                enabling subsizided planet creation
                while retaining visibility to the Ethereum network.
                <br></br>
                <a
                  className="bold underline"
                  target="_blank"
                  rel="noreferrer"
                  href="https://docs.urbit.org/user-manual/id/l2-star">
                  Learn More about the L2 for stars↗
                </a>
              </Box>
            )}
            {isGalaxy && (
              <Box className="mt4">
                Setting the spawn proxy of this galaxy to Layer 2 will allow you
                to spawn stars on Layer 2 for free, but will still require you
                to do all other transactions on Layer 1.
                <br></br>
                <br></br>
                <div className="bold">MIGRATING YOUR GALAXY'S SPAWN PROXY IS NOT RECOMMENDED, AND IS IRREVERSIBLE.</div>
              </Box>
            )}
          </Box>
          <Grid.Item
            full
            as={InlineEthereumTransaction}
            label={`${transfer ? 'Transfer ship' : 'Set spawn proxy'
              } to Layer 2`}
            {...bind}
            onReturn={() => pop()}
          />
        </Box>
      );
    }

    return (
      <Box className="content">
        <Box className="message">
          You are about to migrate an Urbit ID from Layer 1 Ethereum to the Layer 2 rollup. This will
          make transactions cheaper. Here are some things you should know.{' '}
        </Box>
        {!hideInfo && (
          <Box className="info-list">
            <Row className="info-row">
              <Box className="icon-background">
                <StarIcon className="icon" />
              </Box>
              <Box className="info-message">
                <span className="warning">
                  Migration to Layer 2 is irreversible
                </span>
                {'. '}
                You will not be able to revert back to Layer 1.
              </Box>
            </Row>
            <Row className="info-row">
              <Box className="icon-background">
                <Box className="icon">$</Box>
              </Box>
              <Box className="info-message">
                Migration incurs a one-time fee. The estimated
                price is generally less than <span className="bold">$10</span>. Transaction fees
                are subsidized by Tlon on Layer 2, making them effectively free.
              </Box>
            </Row>
            <Row className="info-row">
              <Box className="icon-background">
                <Icon icon="Clock" className="icon" color="white" />
              </Box>
              {/* <HistoryIcon className="icon" /> */}
              <Box className="info-message">
                Subsidized Layer 2 transactions are batched, generally hourly. A
                timer will show when the next push is.
              </Box>
            </Row>
            <a
              className="bold underline"
              target="_blank"
              rel="noreferrer"
              href="https://docs.urbit.org/user-manual/id/layer-2-for-planets">
              Learn More↗
            </a>
          </Box>
        )}
        {!hideInfo && (
          <Row className="hide-row">
            <Checkbox
              className="checkbox"
              selected={hideMessage}
              onClick={() => setHideMessage(!hideMessage)}
            />
            <Box className="dont-show">Do not show this again</Box>
          </Row>
        )}
        <Row className="buttons">
          <Button className="cancel" onClick={goBack}>
            Cancel
          </Button>
          <Button className="proceed" onClick={goProceed}>
            Proceed
          </Button>
        </Row>
      </Box>
    );
  };

  return (
    <View
      className="migrate-l2"
      pop={pop}
      hideBack
      inset
      header={<L2BackHeader back={goBack} />}>
      <Window>
        <HeaderPane>
          <h5>Migrating to Layer 2</h5>
        </HeaderPane>
        <BodyPane>{getContent()}</BodyPane>
      </Window>
    </View>
  );
}
