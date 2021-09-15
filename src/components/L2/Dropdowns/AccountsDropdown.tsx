import React, { useCallback, useState } from 'react';
import * as ob from 'urbit-ob';
import { azimuth } from 'azimuth-js';
import * as need from 'lib/need';
import { Icon, Row, Box, Button } from '@tlon/indigo-react';
import { Just } from 'folktale/maybe';

import Sigil from 'components/Sigil';
import LayerIndicator from 'components/L2/LayerIndicator';
import CopiableAddressWrap from 'components/copiable/CopiableAddressWrap';
import { TooltipPosition } from 'components/WithTooltip';

import { useWallet } from 'store/wallet';
import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { clearInvitesStorage } from 'store/storage/roller';
import { useRollerStore } from 'store/roller';

import { PointLayer } from 'lib/types/PointLayer';
import { abbreviateAddress } from 'lib/utils/address';

import Dropdown from './Dropdown';
import './AccountsDropdown.scss';
import Modal from '../Modal';
import { convertToInt } from 'lib/convertToInt';
import { isPlanet } from 'lib/utils/point';

interface AccountsDropdownProps {
  showMigrate: boolean;
}

const AccountsDropdown = ({ showMigrate = false }: AccountsDropdownProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const walletInfo: any = useWallet();
  const { push, names, reset }: any = useHistory();
  const { setPointCursor }: any = usePointCursor();
  const { controlledPoints }: any = usePointCache();
  const { currentL2 } = useRollerStore();
  const { getDetails }: any = usePointCache();
  const { pointCursor }: any = usePointCursor();
  const point = pointCursor.getOrElse(null);

  let networkKeysNotSet = true;

  if (point) {
    const details = need.details(getDetails(point));
    const isStarOrGalaxy = !isPlanet(point);
    const networkRevision = convertToInt(details.keyRevisionNumber, 10);
    networkKeysNotSet = !currentL2 && isStarOrGalaxy && networkRevision === 0;
  }

  const [showModal, setShowModal] = useState(false);

  const canBitcoin = Just.hasInstance(walletInfo.urbitWallet);

  const points = (controlledPoints?.value?.value?.pointsWithLayers || []).sort(
    (a: PointLayer, b: PointLayer) => a.point - b.point
  );

  const currentAddress = walletInfo?.wallet?.value?.address || '';
  const displayAddress = abbreviateAddress(currentAddress);

  const selectPoint = useCallback(
    (point: number) => () => {
      setPointCursor(Just(point));
      push(names.POINT);
      setOpen(false);
    },
    [push, names.POINT, setOpen, setPointCursor]
  );
  const goMigrate = useCallback(() => push(names.MIGRATE_L2), [
    names.MIGRATE_L2,
    push,
  ]);
  const goBitcoin = useCallback(() => push(names.BITCOIN), [
    names.BITCOIN,
    push,
  ]);

  const onLogout = () => {
    clearInvitesStorage();
    reset();
  };

  return (
    <Dropdown
      className="accounts-dropdown"
      open={open}
      value={currentAddress.slice(0, 6)}
      toggleOpen={() => setOpen(!open)}>
      <CopiableAddressWrap
        className="current-address"
        position={TooltipPosition.Left}>
        {displayAddress}
      </CopiableAddressWrap>
      <Box className="divider" />
      <Box className="points">
        {points.map(({ point, layer }: PointLayer) => {
          const patp = ob.patp(point);

          return (
            <Row
              className="entry"
              onClick={selectPoint(point)}
              key={`point-${point}`}>
              <Box>{patp}</Box>
              <Row>
                <LayerIndicator layer={layer} size="md" />
                <Box className="sigil">
                  <Sigil patp={patp} size={1} colors={['#000000', '#FFFFFF']} />
                </Box>
              </Row>
            </Row>
          );
        })}
      </Box>
      <Box className="divider" />
      {(showMigrate || (!currentL2 && !networkKeysNotSet)) && (
        <Row className="entry" onClick={() => setShowModal(true)}>
          <Box>Migrate</Box>
          <Row className="layer-migration">
            <LayerIndicator layer={1} size="sm" />
            <Icon icon="ArrowEast" />
            <LayerIndicator layer={2} size="sm" />
          </Row>
        </Row>
      )}
      {canBitcoin && (
        <Row className="entry" onClick={goBitcoin}>
          <Box>Bitcoin</Box>
          <Icon icon="Bitcoin" />
        </Row>
      )}
      <Row className="entry" onClick={onLogout}>
        <Box>Logout</Box>
        <Icon icon="LogOut" />
      </Row>
      <Modal show={showModal} hide={() => setShowModal(false)}>
        <Box className="migrate-modal">
          <Box className="close" onClick={() => setShowModal(false)}>
            &#215;
          </Box>
          <Box className="title">Migrating to Layer 2</Box>
          <Box className="message">
            We've upgraded Bridge to support Layer 2 transactions. If you don't
            migrate now, you can always do it later.
          </Box>
          <Box className="warning">Migrating to Layer 2 is irreversible.</Box>
          <Row className="buttons">
            <Button className="cancel" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button className="migrate" onClick={goMigrate}>
              Migrate
            </Button>
          </Row>
        </Box>
      </Modal>
    </Dropdown>
  );
};

export default AccountsDropdown;
