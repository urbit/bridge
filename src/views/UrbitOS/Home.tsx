import React, { useCallback, useState } from 'react';
import { Grid } from 'indigo-react';
import * as ob from 'urbit-ob';
import { azimuth } from 'azimuth-js';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import * as need from 'lib/need';

import NetworkingKeys from 'components/NetworkingKeys';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { ReactComponent as KeyfileIcon } from 'assets/keyfile.svg';

import { useLocalRouter } from 'lib/LocalRouter';
import { L1Point } from 'lib/types/L1Point';
import AlertBox from 'components/AlertBox';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';
import { Box, Button, Row } from '@tlon/indigo-react';
import CopiableWithTooltip from 'components/copiable/CopiableWithTooltip';

import './UrbitOS.scss';

export default function UrbitOSHome() {
  const { pointCursor }: any = usePointCursor();
  const { getDetails }: any = usePointCache();

  const { push, names }: any = useLocalRouter();

  const point = need.point(pointCursor);
  const details: L1Point = need.details(getDetails(point));

  const sponsor = ob.patp(details.sponsor);

  const [showKeys, setShowKeys] = useState(false);

  const showSponsor = azimuth.getPointSize(point) !== azimuth.PointSize.Galaxy;
  const toggleShowKeys = useCallback(() => setShowKeys(s => !s), [setShowKeys]);

  // The initial key revision number is 0, and increments when set
  const hasSetNetworkingKeys = details.keyRevisionNumber !== '0';

  const goNetworkingKeys = useCallback(() => push(names.NETWORKING_KEYS), [
    names,
    push,
  ]);

  const goChangeSponsor = useCallback(() => push(names.CHANGE_SPONSOR), [
    push,
    names,
  ]);

  const { bind: keyBind, code } = useKeyfileGenerator();

  return (
    <Window className="os-home">
      <HeaderPane>
        <Row className="header-row">
          <h5>OS</h5>
          <Button
            className="header-button keyfile"
            disabled={!hasSetNetworkingKeys}
            onClick={keyBind.download}>
            <KeyfileIcon />
            Download Keyfile
          </Button>
          {/* <Grid.Item
            full
            detail="A keyfile is used to boot your Urbit OS"
            as={DownloadKeyfileButton}
            {...keyBind}
          /> */}
        </Row>
      </HeaderPane>
      <BodyPane>
        {showSponsor && (
          <Row className="between-row management">
            <Box>
              <Row>
                <span className="mono">{sponsor}</span>
                <span className="f7 bg-black white p1 mb2 ml2 r4">SPONSOR</span>
              </Row>
              <Box className="subtitle">
                Your sponsor finds new peers in your network
              </Box>
            </Box>
            <Row>
              <Button className="secondary" onClick={goChangeSponsor}>
                Change
              </Button>
            </Row>
          </Row>
        )}
        <Row className="between-row management">
          <Box>
            <Box>Network Keys</Box>
            <Box className="subtitle">
              {hasSetNetworkingKeys
                ? `Revision: ${details.keyRevisionNumber}`
                : 'Unset'}
            </Box>
          </Box>
          <Row>
            <Button className="secondary" onClick={goNetworkingKeys}>
              {hasSetNetworkingKeys ? 'Reset' : 'Initialize'}
            </Button>
            {hasSetNetworkingKeys && (
              <Button className="secondary" onClick={toggleShowKeys}>
                {showKeys ? 'Hide' : 'View'}
              </Button>
            )}
          </Row>
        </Row>

        {showKeys && <Grid.Item full as={NetworkingKeys} point={point} />}

        {!hasSetNetworkingKeys && (
          <>
            <Grid.Item full as={AlertBox} className="mt4">
              Networking Keys are required to generate a keyfile
            </Grid.Item>
          </>
        )}

        {!!code && (
          <Row className="between-row management">
            <Box>
              <Box>Access Key</Box>
              <Box className="subtitle">Your passkey to login to Landscape</Box>
            </Box>
            <Row>
              <CopiableWithTooltip text={code} className="copy-button" />
            </Row>
          </Row>
        )}
      </BodyPane>
    </Window>
  );
}
