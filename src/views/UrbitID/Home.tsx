import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import { Box, Button, Icon, Row } from '@tlon/indigo-react';

import { useLocalRouter } from 'lib/LocalRouter';
import { PROXY_TYPE } from 'lib/proxy';
import * as need from 'lib/need';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import { convertToInt } from 'lib/convertToInt';
import { ETH_ZERO_ADDR } from 'lib/constants';
import { abbreviateAddress } from 'lib/utils/address';

import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';
import { useRollerStore } from 'store/rollerStore';

import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import CopiableWithTooltip from 'components/copiable/CopiableWithTooltip';

import './UrbitID.scss';

export default function UrbitIDHome() {
  const { push, names }: any = useLocalRouter();
  const { getDetails }: any = usePointCache();
  const { urbitWallet }: any = useWallet();
  const { point } = useRollerStore();

  const goDownloadKeys = useCallback(() => push(names.DOWNLOAD_KEYS), [
    push,
    names,
  ]);

  const goSigil = useCallback(() => push(names.SIGIL_GENERATOR), [push, names]);

  const goResetKeys = useCallback(() => push(names.RESET_KEYS), [push, names]);

  const isMasterTicket = Just.hasInstance(urbitWallet);
  const details = need.details(getDetails(point.value));
  const { isOwner, canManage } = useCurrentPermissions();
  const networkRevision = convertToInt(details.keyRevisionNumber, 10);

  const goSetProxy = useCallback(
    proxyType => push(names.SET_PROXY, { proxyType }),
    [push, names]
  );

  const goTransfer = useCallback(() => push(names.TRANSFER), [names, push]);

  const noManagement = details.managementProxy === ETH_ZERO_ADDR;
  const noSpawn = details.spawnProxy === ETH_ZERO_ADDR;
  const showSpawn = point.isL1 && !point.isL2Spawn;

  return (
    <Window className="id-home">
      <HeaderPane>
        <Row className="header-row">
          <h5>ID</h5>
          {isMasterTicket && (
            <Button onClick={goDownloadKeys} className="header-button">
              Download Passport
            </Button>
          )}
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

        {canManage && (
          <Row className="between-row management">
            <Box>
              <Box>Management Address</Box>
              <div className="mt1 mono black subtitle">
                {noManagement
                  ? 'Not set'
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

        {point.isParent && networkRevision !== 0 && showSpawn && (
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
                  ? 'Reset Master Ticket and all other keys'
                  : 'Transfer to Master Ticket, resetting all keys'}
              </Box>
            </Box>
            <Button className="secondary" onClick={goResetKeys}>
              {isMasterTicket ? 'Reset' : 'Transfer'}
            </Button>
          </Row>
        )}

        {point.isParent && networkRevision === 0 && (
          <Row className="between-row management">
            <Box>
              <Box>Network Keys Required</Box>
              <Box className="subtitle">
                Set your network keys in "OS" to spawn points
              </Box>
            </Box>
          </Row>
        )}

        <Row className="between-row sigil" onClick={goSigil}>
          <Box>
            <Box>Sigil</Box>
            <Box className="subtitle">Modify and download your sigil</Box>
          </Box>
          <Icon className="arrow-button" icon="ArrowEast" />
        </Row>

        {point.isGalaxy && (
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
