import React, { useState, useEffect, useCallback } from 'react';
import { Grid } from 'indigo-react';
import { ecliptic } from 'azimuth-js';
import * as ob from 'urbit-ob';

import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import BodyPane from 'components/L2/Window/BodyPane';
import HeaderPane from 'components/L2/Window/HeaderPane';
import Window from 'components/L2/Window/Window';
import { ReactComponent as StarIcon } from 'assets/star.svg';

import { useLocalRouter } from 'lib/LocalRouter';
import * as need from 'lib/need';

import { usePointCursor } from 'store/pointCursor';

import './MigrateL2.scss';
import { Box, Button, Checkbox, Icon, Row } from '@tlon/indigo-react';
import {
  getHideMigrationMessage,
  storeHideMigrationMessage,
} from 'store/storage/roller';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import Dropdown from 'components/L2/Dropdowns/Dropdown';
import { PointLayer } from 'lib/types/PointLayer';
import Sigil from 'components/Sigil';
import { isPlanet, isStar } from 'lib/utils/point';

const DUMMY_L2_ADDRESS = '0x1111111111111111111111111111111111111111';

const PointEntry = ({
  point,
  select,
}: {
  point: number;
  select?: () => void;
}) => {
  const patp = ob.patp(point);

  return (
    <Row className="entry" onClick={select}>
      <Box className="sigil">
        <Sigil patp={patp} size={1} colors={['#000000', '#FFFFFF']} />
      </Box>
      <Box>{patp}</Box>
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
  const { pointCursor }: any = usePointCursor();
  const { controlledPoints }: any = usePointCache();

  const [proceed, setProceed] = useState(false);
  const [hideMessage, setHideMessage] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [transfer, setTransfer] = useState(true);

  const points = controlledPoints?.value?.value?.pointsWithLayers || [];
  const l1Points = points.filter(({ layer }: PointLayer) => layer === 1);

  let { point } =
    l1Points.find((p: any) => isStar(p.point)) || controlledPoints[0];

  try {
    point = need.point(pointCursor);
  } catch (e) {}

  const [selectedPoint, setSelectedPoint] = useState(point);
  const hideInfo = getHideMigrationMessage();

  const { construct, unconstruct, bind, completed } = useMigrate();

  useEffect(() => {
    if (point) {
      construct(point, transfer);
    } else {
      unconstruct();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (completed) {
      pop();
    }
  }, [completed, pop]);

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
    (point: number) => {
      if (!isStar(point)) {
        setTransfer(true);
      }
      setSelectedPoint(point);
      setShowDropdown(false);
      construct(point, transfer);
    },
    [setSelectedPoint, setShowDropdown, construct, transfer]
  );

  const toggleTransfer = useCallback(() => {
    construct(selectedPoint, !transfer);
    setTransfer(!transfer);
  }, [transfer, setTransfer, construct, selectedPoint]);

  const getContent = () => {
    const star = isStar(selectedPoint);

    if (l1Points.length === 0) {
      return (
        <Box className="content">
          <Box className="ship-selector">
            <Box>All of your ships are already on Layer 2.</Box>
          </Box>
        </Box>
      );
    }

    if (proceed) {
      return (
        <Box className="content">
          <Box className="ship-selector">
            <Box>Ship</Box>
            <Box className="select-ship">Select one of your ships</Box>
            <Dropdown
              open={showDropdown}
              toggleOpen={() => setShowDropdown(!showDropdown)}
              value={<PointEntry point={selectedPoint} />} // change this to include the sigil
              className="migrate-selector">
              {l1Points.map(({ point }: PointLayer) => (
                <PointEntry
                  point={point}
                  key={point}
                  select={() => selectPoint(point)}
                />
              ))}
            </Dropdown>
            {star && (
              <Box className="transfer-spawn-selector">
                <Box
                  onClick={toggleTransfer}
                  className={`transfer ${transfer ? 'selected' : ''}`}>
                  Transfer Point
                </Box>
                <Box
                  onClick={toggleTransfer}
                  className={`spawn ${!transfer ? 'selected' : ''}`}>
                  Set Spawn Proxy
                </Box>
              </Box>
            )}
            {star && (
              <Box>
                Transferring this point will allow you to conduct all
                transactions on Layer 2 and is irreversible. Setting the spawn
                proxy of a star to the Layer 2 contract is reversible, will
                allow you to create planet invites for free, but will require
                you to do all other transactions on Layer 1.
              </Box>
            )}
          </Box>
          <Grid.Item
            full
            as={InlineEthereumTransaction}
            label={`${
              transfer ? 'Transfer point' : 'Set spawn proxy'
            } to Layer 2`}
            {...bind}
            onReturn={pop}
          />
        </Box>
      );
    }

    return (
      <Box className="content">
        <Box className="message">
          You are about to migrate a node from Layer 1 to Layer 2. This will
          make transactions faster and cheaper. Here are some things you should
          know.{' '}
          <a
            className="bold"
            target="_blank"
            rel="noreferrer"
            href="https://discord.com/channels/879614191672115260/879624035028324362">
            Learn More
          </a>
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
                A migration is expensive, but a one-time fee. The estimated
                price is <span className="bold">$120</span>. Transaction fees
                will be subsidized on Layer 2.
              </Box>
            </Row>
            <Row className="info-row">
              <Box className="icon-background">
                <Icon icon="Clock" className="icon" color="white" />
              </Box>
              {/* <HistoryIcon className="icon" /> */}
              <Box className="info-message">
                All transactions will now be pushed at the end of the day. A
                timer will show when the next push is.
              </Box>
            </Row>
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
