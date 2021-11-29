import React, { useCallback, useState } from 'react';
import { Grid } from 'indigo-react';
import * as ob from 'urbit-ob';

import NetworkingKeys from 'components/NetworkingKeys';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { ReactComponent as KeyfileIcon } from 'assets/keyfile.svg';

import { useLocalRouter } from 'lib/LocalRouter';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';
import { Box, Button, Row } from '@tlon/indigo-react';
import CopiableWithTooltip from 'components/copiable/CopiableWithTooltip';

import './UrbitOS.scss';
import Modal from 'components/L2/Modal';
import { useRollerStore } from 'store/rollerStore';

export default function UrbitOSHome() {
  const { point } = useRollerStore();

  const { push, names }: any = useLocalRouter();

  const sponsor = ob.patp(point.sponsor);

  const [showKeys, setShowKeys] = useState(false);

  const showSponsor = !point.isGalaxy;
  const toggleShowKeys = useCallback(() => setShowKeys(s => !s), [setShowKeys]);

  // The initial key revision number is 0, and increments when set
  const hasSetNetworkingKeys = point.keyRevisionNumber !== '0';

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
          {hasSetNetworkingKeys && (
            <Button
              className="header-button keyfile"
              disabled={!hasSetNetworkingKeys}
              onClick={keyBind.download}>
              <KeyfileIcon />
              Download Keyfile
            </Button>
          )}
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
            <Box
              className={`subtitle ${
                !hasSetNetworkingKeys ? 'error-text' : ''
              }`}>
              {hasSetNetworkingKeys
                ? `Revision: ${point.keyRevisionNumber}`
                : 'No network keys found'}
            </Box>
          </Box>
          <Row>
            <Button
              className={hasSetNetworkingKeys ? 'secondary' : 'primary'}
              onClick={goNetworkingKeys}>
              {hasSetNetworkingKeys ? 'Reset' : 'Initialize'}
            </Button>
            {hasSetNetworkingKeys && (
              <Button className="secondary" onClick={toggleShowKeys}>
                View
              </Button>
            )}
          </Row>
        </Row>

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

      <Modal show={showKeys} hide={() => setShowKeys(false)}>
        <Box className="show-keys-modal-content">
          <Grid.Item full as={NetworkingKeys} point={point.value} />
        </Box>
      </Modal>
    </Window>
  );
}
