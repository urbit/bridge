import React, { useCallback, useState } from 'react';
import { Grid } from 'indigo-react';
import * as ob from 'urbit-ob';

import NetworkKeys from 'components/NetworkKeys';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { ReactComponent as KeyfileIcon } from 'assets/keyfile.svg';
import { ReactComponent as InfoIcon } from 'assets/info.svg';

import { useLocalRouter } from 'lib/LocalRouter';
import { useSingleKeyfileGenerator } from 'lib/useKeyfileGenerator';
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
  const hasSetNetworkKeys = Number(point.keyRevisionNumber) > 0;

  const goNetworkKeys = useCallback(() => push(names.NETWORKING_KEYS), [
    names,
    push,
  ]);

  const goChangeSponsor = useCallback(() => push(names.CHANGE_SPONSOR), [
    push,
    names,
  ]);

  const { available, code, download, generating } = useSingleKeyfileGenerator(
    {}
  );
  const keyfileAvailable = available && !generating;
  const [showKeysUnavailableModal, setShowKeysUnavailableModal] = useState(
    false
  );

  const headerButton = () => {
    if (!hasSetNetworkKeys) {
      return null;
    }

    if (generating) {
      return <Box className="header-button keyfile">Generating...</Box>;
    }

    return keyfileAvailable ? (
      <Button className="header-button keyfile" onClick={download}>
        <KeyfileIcon />
        Download Keyfile
      </Button>
    ) : (
      <>
        <Button
          className="header-button keyfile-unavailable"
          onClick={() => setShowKeysUnavailableModal(true)}>
          <InfoIcon />
          &nbsp;Keyfile Unavailable
        </Button>
        <Modal
          show={showKeysUnavailableModal}
          hide={() => setShowKeysUnavailableModal(false)}>
          <Box className="info-modal-content">
            <div className="fw-bold mb5">Keyfile Unavailable</div>
            <div className="mb5">
              If you set networking keys with an older version of Bridge, try
              logging in again with "Use Legacy Token" selected.
            </div>
          </Box>
        </Modal>
      </>
    );
  };

  return (
    <Window className="os-home">
      <HeaderPane>
        <Row className="header-row">
          <h5>OS</h5>
          {headerButton()}
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
              className={`subtitle ${!hasSetNetworkKeys ? 'error-text' : ''}`}>
              {hasSetNetworkKeys
                ? `Revision: ${point.keyRevisionNumber}`
                : 'No network keys found'}
            </Box>
          </Box>
          <Row>
            <Button
              className={hasSetNetworkKeys ? 'secondary' : 'primary'}
              onClick={goNetworkKeys}>
              {hasSetNetworkKeys ? 'Reset' : 'Initialize'}
            </Button>
            {hasSetNetworkKeys && (
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
          <Grid.Item full as={NetworkKeys} />
        </Box>
      </Modal>
    </Window>
  );
}
