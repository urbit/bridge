import React, { useCallback } from 'react';
import { azimuth } from 'azimuth-js';
import { Just } from 'folktale/maybe';
import { Box, Button, Icon, Row } from '@tlon/indigo-react';

import { useLocalRouter } from 'lib/LocalRouter';
import { PROXY_TYPE } from 'lib/proxy';
import * as need from 'lib/need';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import { convertToInt } from 'lib/convertToInt';
import { ETH_ZERO_ADDR } from 'lib/constants';
import { abbreviateAddress } from 'lib/utils/address';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';
import { useRollerStore } from 'store/roller';

import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import CopiableWithTooltip from 'components/copiable/CopiableWithTooltip';

import './UrbitID.scss';

export default function UrbitIDHome() {
  const { push, names }: any = useLocalRouter();
  const { pointCursor }: any = usePointCursor();
  const { getDetails }: any = usePointCache();
  const { urbitWallet }: any = useWallet();
  const { currentPoint } = useRollerStore();

  const goSigil = useCallback(() => push(names.SIGIL_GENERATOR), [push, names]);

  const goDownloadKeys = useCallback(() => push(names.DOWNLOAD_KEYS), [
    push,
    names,
  ]);

  const goUrbitOS = useCallback(() => push(names.URBIT_OS), [push, names]);

  const goResetKeys = useCallback(() => push(names.RESET_KEYS), [push, names]);

  const isMasterTicket = Just.hasInstance(urbitWallet);
  const point = need.point(pointCursor);
  const details = need.details(getDetails(point));
  const { isOwner } = useCurrentPermissions();
  const networkRevision = convertToInt(details.keyRevisionNumber, 10);

  const pointSize = azimuth.getPointSize(point);
  const isParent = pointSize !== azimuth.PointSize.Planet;
  const isSenate = pointSize === azimuth.PointSize.Galaxy;

  const goSetProxy = useCallback(
    proxyType => push(names.SET_PROXY, { proxyType }),
    [push, names]
  );

  const goTransfer = useCallback(() => push(names.TRANSFER), [names, push]);

  const noManagement = details.managementProxy === ETH_ZERO_ADDR;
  const noSpawn = details.spawnProxy === ETH_ZERO_ADDR;
  const showSpawn = currentPoint?.dominion === 'l1';
  const showManage = showSpawn || currentPoint?.dominion === 'spawn';

  return (
    <Window className="id-home">
      <HeaderPane>
        <Row className="header-row">
          <h5>ID</h5>
          <Button className="header-button">Download Passport</Button>
        </Row>
      </HeaderPane>
      <BodyPane>
        {isOwner && (
          <Row className="between-row owner">
            <Box>
              <Box>Ownership Address</Box>
              <div className="mt1 mono black subtitle">
                {abbreviateAddress(details.owner)}
              </div>
            </Box>
            <Row>
              <Button className="secondary" onClick={goTransfer}>
                Transfer
              </Button>
              <CopiableWithTooltip
                text={details.owner}
                className="copy-button"
              />
            </Row>
          </Row>
        )}

        {isOwner && showManage && (
          <Row className="between-row management">
            <Box>
              <Box>Management Address</Box>
              <div className="mt1 mono black subtitle">
                {noManagement
                  ? 'Unset'
                  : abbreviateAddress(details.managementProxy)}
              </div>
            </Box>
            <Row>
              <Button
                className="secondary"
                onClick={() => goSetProxy(PROXY_TYPE.MANAGEMENT)}>
                {noManagement ? 'Set' : 'Change'}
              </Button>
              {!noManagement && (
                <CopiableWithTooltip
                  text={details.managementProxy}
                  className="copy-button"
                />
              )}
            </Row>
          </Row>
        )}

        {isParent && networkRevision !== 0 && showSpawn && (
          <Row className="between-row management">
            <Box>
              <Box>Spawn Proxy Address</Box>
              <div className="mt1 mono black subtitle">
                {noSpawn ? 'Unset' : abbreviateAddress(details.spawnProxy)}
              </div>
            </Box>
            <Row>
              <Button
                className="secondary"
                onClick={() => goSetProxy(PROXY_TYPE.SPAWN)}>
                {noSpawn ? 'Set' : 'Change'}
              </Button>
              {!noSpawn && (
                <CopiableWithTooltip
                  text={details.spawnProxy}
                  className="copy-button"
                />
              )}
            </Row>
          </Row>
        )}

        {isOwner && (
          <Row className="between-row management">
            <Box>
              <Box>Master Ticket</Box>
              <Box className="subtitle">
                {isMasterTicket
                  ? 'Reset Master Key and all other keys'
                  : 'Transfer to Master Ticket, resetting all keys'}
              </Box>
            </Box>
            <Button className="secondary" onClick={goResetKeys}>
              {isMasterTicket ? 'Reset' : 'Transfer'}
            </Button>
          </Row>
        )}

        {isParent && networkRevision === 0 && (
          <Row className="between-row management">
            <Box>
              <Box>Network Keys Required</Box>
              <Box className="subtitle">
                Set your network keys to spawn points
              </Box>
            </Box>
            <Button className="secondary" onClick={goUrbitOS}>
              Set Keys
            </Button>
          </Row>
        )}

        {isMasterTicket && (
          <Row className="between-row management">
            <Box>
              <Box>Download Keys</Box>
              <Box className="subtitle">
                Download the keys to your master ticket.
              </Box>
            </Box>
            <Button className="secondary" onClick={goDownloadKeys}>
              Download
            </Button>
          </Row>
        )}

        <Row className="between-row sigil" onClick={goSigil}>
          <Box>
            <Box>Sigil</Box>
            <Box className="subtitle">Modify and download your sigil</Box>
          </Box>
          <Icon className="arrow-button" icon="ArrowEast" />
        </Row>

        {isSenate && (
          <Row className="between-row management">
            <Box>
              <Box>Edit Voting Key</Box>
            </Box>
            <Button
              className="secondary"
              onClick={() => goSetProxy(PROXY_TYPE.VOTING)}>
              Edit
            </Button>
          </Row>
        )}
      </BodyPane>
    </Window>
  );
}
