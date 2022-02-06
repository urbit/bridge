import React, { useCallback, useState, useMemo } from 'react';
import * as need from 'lib/need';
import { Just, Nothing } from 'folktale/maybe';
import { Box, Button, Icon, Row } from '@tlon/indigo-react';

import { useLocalRouter } from 'lib/LocalRouter';
import { PROXY_TYPE } from 'lib/proxy';
import { convertToInt } from 'lib/convertToInt';
import {
  DUMMY_L2_ADDRESS,
  ETH_ZERO_ADDR,
  MASTER_TICKET_TOOLTIP,
} from 'lib/constants';
import { abbreviateAddress } from 'lib/utils/address';
import { downloadWallet } from 'lib/invite';
import { useHomeKeyfileGenerator } from 'lib/useKeyfileGenerator';

import { useWallet } from 'store/wallet';
import { useRollerStore } from 'store/rollerStore';

import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import CopiableWithTooltip from 'components/copiable/CopiableWithTooltip';
import PaperBuilder from 'components/PaperBuilder';

import './UrbitID.scss';
import LayerIndicator from 'components/L2/LayerIndicator';
import WithTooltip from 'components/WithTooltip';

export default function UrbitIDHome() {
  const { push, names }: any = useLocalRouter();
  const { urbitWallet }: any = useWallet();
  const { point } = useRollerStore();

  const [keysDownloaded, setKeysDownloaded] = useState(false);

  const _urbitWallet = useMemo(() => {
    try {
      const wallet = need.wallet(urbitWallet);
      return wallet;
    } catch (err) {
      return null;
    }
  }, [urbitWallet]);
  const { keyfile, filename } = useHomeKeyfileGenerator({});
  const [paper, setPaper] = useState(Nothing());

  const downloadKeys = useCallback(() => {
    downloadWallet(paper.value, keyfile, filename);
    setKeysDownloaded(true);
  }, [paper, keyfile, filename, setKeysDownloaded]);

  const goSigil = useCallback(() => push(names.SIGIL_GENERATOR), [push, names]);

  const goResetKeys = useCallback(() => push(names.RESET_KEYS), [push, names]);

  const isMasterTicket = Just.hasInstance(urbitWallet);
  const { isOwner, canManage } = point;
  const networkRevision = convertToInt(point.keyRevisionNumber, 10);

  const goSetProxy = useCallback(
    proxyType => push(names.SET_PROXY, { proxyType }),
    [push, names]
  );

  const goTransfer = useCallback(() => push(names.TRANSFER), [names, push]);

  const noManagement = point.managementProxy === ETH_ZERO_ADDR;
  const noSpawn =
    point.spawnProxy === ETH_ZERO_ADDR || point.spawnProxy === DUMMY_L2_ADDRESS;

  return (
    <Window className="id-home">
      <HeaderPane>
        <Row className="header-row">
          <h5>ID</h5>
          {isMasterTicket && (
            <Button onClick={downloadKeys} className="header-button">
              {keysDownloaded
                ? 'Downloaded!'
                : paper.matchWith({
                    Nothing: () => 'Printing and folding...',
                    Just: (_: any) => 'Download Passport',
                  })}
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
                {abbreviateAddress(point.owner)}
              </div>
            </Box>
            <Row>
              <Button className="secondary" onClick={goTransfer}>
                Transfer
              </Button>
              <CopiableWithTooltip text={point.owner} className="copy-button" />
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
                  : abbreviateAddress(point.managementProxy)}
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
                  text={point.managementProxy}
                  className="copy-button"
                />
              )}
            </Row>
          </Row>
        )}

        {point.isParent && (
          <Row className="between-row management">
            <Box>
              <Box>Spawn Proxy Address</Box>
              <div className="mt1 mono black subtitle">
                {noSpawn ? 'Not set' : abbreviateAddress(point.spawnProxy)}
              </div>
            </Box>
            <Row>
              {point.isL2Spawn && <LayerIndicator size="lg" layer={2} />}
              <Button
                className="secondary"
                onClick={() => goSetProxy(PROXY_TYPE.SPAWN)}>
                {noSpawn ? 'Set' : 'Change'}
              </Button>
              {!noSpawn && (
                <CopiableWithTooltip
                  text={point.spawnProxy}
                  className="copy-button"
                />
              )}
            </Row>
          </Row>
        )}

        {isOwner && (
          <Row className="between-row management">
            <WithTooltip content={MASTER_TICKET_TOOLTIP}>
              <Box>
                <Box>Master Ticket</Box>
                <Box className="subtitle">
                  {isMasterTicket
                    ? 'Reset Master Ticket and all other keys'
                    : 'Transfer to Master Ticket, resetting all keys'}
                </Box>
              </Box>
            </WithTooltip>
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
      {_urbitWallet && (
        <PaperBuilder
          point={point.value}
          wallets={[_urbitWallet]}
          callback={(paper: any) => {
            setPaper(Just(paper));
          }}
        />
      )}
    </Window>
  );
}
