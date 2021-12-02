import { useCallback, useMemo, useState } from 'react';
import { Icon, Row, Box } from '@tlon/indigo-react';
import { Just } from 'folktale/maybe';

import LayerIndicator from 'components/L2/LayerIndicator';
import CopiableAddressWrap from 'components/copiable/CopiableAddressWrap';
import { TooltipPosition } from 'components/WithTooltip';

import { useWallet } from 'store/wallet';
import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';
import { clearInvitesStorage } from 'store/storage/roller';
import { useRollerStore } from 'store/rollerStore';

import { abbreviateAddress } from 'lib/utils/address';

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
  const { point, pointList } = useRollerStore();

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

  const goSpawn = useCallback(() => {
    if (point.isL2Spawn && point.isStar) {
      push(names.INVITE_COHORT);
    } else {
      push(names.ISSUE_CHILD);
    }
  }, [names, push, point]);

  const onLogout = () => {
    clearInvitesStorage();
    reset();
  };

  const hasL1Points = Boolean(pointList.find(({ layer }) => layer === 1));
  const showMigrateOption = useMemo(() => {
    return showMigrate || hasL1Points;
  }, [hasL1Points, showMigrate]);

  const displayText =
    point.value >= 0 ? point.patp : currentAddress.slice(0, 6);

  return (
    <Dropdown
      className="accounts-dropdown"
      open={open}
      value={displayText}
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
            className={`entry point ${value === point.value ? 'selected' : ''}`}
            onClick={selectPoint(value)}
            key={`point-${value}`}>
            <Box>{patp}</Box>
            <Row>
              <LayerIndicator
                layer={layer}
                size="smt"
                selected={value === point.value}
              />
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
      {point.isParent && point.canSpawn && (
        <Row className="entry" onClick={goSpawn}>
          <Box>
            {point.isStar
              ? point.isL2Spawn
                ? 'Generate Invites'
                : 'Spawn Planets'
              : 'Spawn Stars'}
          </Box>
          <Icon icon="Plus" />
        </Row>
      )}
      <Row className="entry" onClick={onLogout}>
        <Box>Logout</Box>
        <Icon icon="LogOut" />
      </Row>
    </Dropdown>
  );
};

export default AccountsDropdown;
