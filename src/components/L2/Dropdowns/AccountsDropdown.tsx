import { useCallback, useMemo, useState } from 'react';
import { Icon, Row, Box } from '@tlon/indigo-react';
import { Just } from 'folktale/maybe';

import Sigil from 'components/Sigil';
import LayerIndicator from 'components/L2/LayerIndicator';
import CopiableAddressWrap from 'components/copiable/CopiableAddressWrap';
import { TooltipPosition } from 'components/WithTooltip';

import { useWallet } from 'store/wallet';
import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';
import { clearInvitesStorage } from 'store/storage/roller';
import { useRollerStore } from 'store/rollerStore';

import { abbreviateAddress } from 'lib/utils/address';
import useCurrentPermissions from 'lib/useCurrentPermissions';

import Dropdown from './Dropdown';
import './AccountsDropdown.scss';

interface AccountsDropdownProps {
  showMigrate: boolean;
}

const AccountsDropdown = ({ showMigrate = false }: AccountsDropdownProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const walletInfo: any = useWallet();
  const { push, popTo, names, reset }: any = useHistory();
  const { setPointCursor }: any = usePointCursor();
  const { pointList } = useRollerStore();

  const canBitcoin = Just.hasInstance(walletInfo.urbitWallet);

  const currentAddress = walletInfo?.wallet?.value?.address || '';
  const displayAddress = abbreviateAddress(currentAddress);

  const selectPoint = useCallback(
    (point: number) => () => {
      popTo(names.POINTS);
      setPointCursor(Just(point));
      push(names.POINT);
      setOpen(false);
    },
    [push, popTo, names, setOpen, setPointCursor]
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

  const hasL1Points = Boolean(pointList.find(({ layer }) => layer === 1));
  const showMigrateOption = useMemo(() => {
    return showMigrate || hasL1Points;
  }, [hasL1Points, showMigrate]);

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
        {pointList.map(({ value, layer, patp }) => (
          <Row
            className="entry point"
            onClick={selectPoint(value)}
            key={`point-${value}`}>
            <Box>{patp}</Box>
            <Row>
              <LayerIndicator layer={layer} size="md" />
              <Box className="sigil">
                <Sigil patp={patp} size={1} colors={['#000000', '#FFFFFF']} />
              </Box>
            </Row>
          </Row>
        ))}
      </Box>
      <Box className="divider" />
      {showMigrateOption && (
        <Row className="entry" onClick={goMigrate}>
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
          <Box>{isStar ? 'Generate Invites' : 'Spawn Stars'}</Box>
          <Icon icon="Plus" />
        </Row>
      )}
      <Row className="entry" onClick={onLogout}>
        <Box>Logout</Box>
        <Icon icon="LogOut" />
      </Row>
      {/* <Modal show={showModal} hide={() => setShowModal(false)}>
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
      </Modal> */}
    </Dropdown>
  );
};

export default AccountsDropdown;
