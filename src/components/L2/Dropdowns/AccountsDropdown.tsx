import React, { useState } from 'react';
import * as ob from 'urbit-ob';
import { Icon, Row } from '@tlon/indigo-react';
import { Just } from 'folktale/maybe';

import Sigil from 'components/Sigil';
import LayerIndicator from 'components/L2/LayerIndicator';
import { useWallet } from 'store/wallet';
import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import CopiableAddressWrap from 'components/copiable/CopiableAddressWrap';
import Dropdown from './Dropdown';

import './AccountsDropdown.scss';

const AccountsDropdown = () => {
  const [open, setOpen] = useState<boolean>(false);
  const walletInfo: any = useWallet();
  const { push, names, reset }: any = useHistory();
  const { setPointCursor }: any = usePointCursor();
  const { controlledPoints }: any = usePointCache();

  const canBitcoin = Just.hasInstance(walletInfo.urbitWallet);

  const points =
    controlledPoints?.value?.value?.ownedPoints?.map((point: string) =>
      Number(point)
    ) || [];

  const currentAddress = walletInfo?.wallet?.value?.address || '';
  const addressLeadingFive = currentAddress.slice(0, 5);
  const displayAddress = `${addressLeadingFive}...${currentAddress.slice(-4)}`;

  const selectPoint = (point: number) => () => {
    setPointCursor(Just(point));
    push(names.POINT);
    setOpen(false);
  };
  const goToMigrate = () => push(names.MIGRATE);
  const goToBitcoin = () => push(names.BITCOIN);
  const onLogout = reset;

  return (
    <Dropdown
      className="accounts-dropdown"
      open={open}
      value={addressLeadingFive}
      toggleOpen={() => setOpen(!open)}>
      <CopiableAddressWrap className="current-address">
        {displayAddress}
      </CopiableAddressWrap>
      <div className="divider" />
      <div className="points">
        {points.map((point: number) => {
          const patp = ob.patp(point);

          return (
            <Row
              className="entry"
              onClick={selectPoint(point)}
              key={`point-${point}`}>
              <div>{patp}</div>
              <Row>
                <LayerIndicator layer={1} size="md" />
                <div className="sigil">
                  <Sigil patp={patp} size={1} colors={['#000000', '#FFFFFF']} />
                </div>
              </Row>
            </Row>
          );
        })}
      </div>
      <div className="divider" />
      <Row className="entry" onClick={goToMigrate}>
        <div>Migrate</div>
        <Row className="layer-migration">
          <LayerIndicator layer={1} size="sm" />
          <Icon icon="ArrowEast" />
          <LayerIndicator layer={2} size="sm" />
        </Row>
      </Row>
      {canBitcoin && (
        <Row className="entry" onClick={goToBitcoin}>
          <div>Bitcoin</div>
          <Icon icon="Bitcoin" />
        </Row>
      )}
      <Row className="entry" onClick={onLogout}>
        <div>Logout</div>
        <Icon icon="LogOut" />
      </Row>
    </Dropdown>
  );
};

export default AccountsDropdown;
