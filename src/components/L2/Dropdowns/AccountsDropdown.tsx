import { useCallback, useMemo, useState } from 'react';
import * as ob from 'urbit-ob';
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

import { PointLayer } from 'lib/types/PointLayer';
import { abbreviateAddress } from 'lib/utils/address';

import Dropdown from './Dropdown';
import './AccountsDropdown.scss';
import Modal from '../Modal';
import { useHasNetworkKeysSet } from 'lib/useHasNetworkKeysSet';
import { useRollerStore } from 'store/roller';
import useCurrentPermissions from 'lib/useCurrentPermissions';

interface AccountsDropdownProps {
  showMigrate: boolean;
}

const AccountsDropdown = ({ showMigrate = false }: AccountsDropdownProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const walletInfo: any = useWallet();
  const { push, popTo, names, reset }: any = useHistory();
  const { setPointCursor }: any = usePointCursor();
  const { controlledPoints }: any = usePointCache();
  const { currentL2 }: any = useRollerStore();

  const networkKeysSet = useHasNetworkKeysSet();
  const showMigrateOption = useMemo(() => {
    return showMigrate || (!currentL2 && networkKeysSet);
  }, [currentL2, networkKeysSet, showMigrate]);

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

  const goHome = useCallback(() => popTo(names.POINTS), [names, popTo]);

  const goMigrate = useCallback(() => push(names.MIGRATE_L2), [
    names.MIGRATE_L2,
    push,
  ]);

  const goBitcoin = useCallback(() => push(names.BITCOIN), [
    names.BITCOIN,
    push,
  ]);

  const goIssuePoint = useCallback(() => push(names.ISSUE_CHILD), [
    names.ISSUE_CHILD,
    push,
  ]);

  const onLogout = () => {
    clearInvitesStorage();
    reset();
  };

  const { canSpawn, isParent, isStar } = useCurrentPermissions();

  return (
    <Dropdown
      className="accounts-dropdown"
      open={open}
      value={currentAddress.slice(0, 6)}
      toggleOpen={() => setOpen(!open)}>
      <CopiableAddressWrap
        className="current-address"
        position={TooltipPosition.Left}
        text={currentAddress}>
        <Box onClick={goHome}>{displayAddress}</Box>
      </CopiableAddressWrap>
      <Box className="divider" />
      <Box className="points">
        {points.map(({ point, layer }: PointLayer) => {
          const patp = ob.patp(point);

          return (
            <Row
              className="entry point"
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
      {showMigrateOption && (
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
      {isParent && canSpawn && (
        <Row className="entry" onClick={goIssuePoint}>
          <Box>Spawn{isStar ? ' Planets' : ' Stars'}</Box>
          <Icon icon="Plus" />
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
