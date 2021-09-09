import React, { useState } from 'react';
import * as ob from 'urbit-ob';
import { Icon, Row, Box } from '@tlon/indigo-react';
import { Just } from 'folktale/maybe';

import Sigil from 'components/Sigil';
import LayerIndicator from 'components/L2/LayerIndicator';
import { useWallet } from 'store/wallet';
import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { clearInvitesStorage } from 'store/storage/roller';
import CopiableAddressWrap from 'components/copiable/CopiableAddressWrap';
import Dropdown from './Dropdown';

import './AccountsDropdown.scss';
import { abbreviateAddress } from 'lib/utils/address';
import { PointLayer } from 'lib/types/PointLayer';

const AccountsDropdown = () => {
  const [open, setOpen] = useState<boolean>(false);
  const walletInfo: any = useWallet();
  const { push, names, reset }: any = useHistory();
  const { setPointCursor }: any = usePointCursor();
  const { controlledPoints }: any = usePointCache();

  const canBitcoin = Just.hasInstance(walletInfo.urbitWallet);

  const points = controlledPoints?.value?.value?.pointsWithLayers || [];

  const currentAddress = walletInfo?.wallet?.value?.address || '';
  const displayAddress = abbreviateAddress(currentAddress);

  const selectPoint = (point: number) => () => {
    setPointCursor(Just(point));
    push(names.POINT);
    setOpen(false);
  };
  const goToMigrate = () => push(names.MIGRATE);
  const goToBitcoin = () => push(names.BITCOIN);
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
      <CopiableAddressWrap className="current-address">
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
      <Row className="entry" onClick={goToMigrate}>
        <Box>Migrate</Box>
        <Row className="layer-migration">
          <LayerIndicator layer={1} size="sm" />
          <Icon icon="ArrowEast" />
          <LayerIndicator layer={2} size="sm" />
        </Row>
      </Row>
      {canBitcoin && (
        <Row className="entry" onClick={goToBitcoin}>
          <Box>Bitcoin</Box>
          <Icon icon="Bitcoin" />
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
