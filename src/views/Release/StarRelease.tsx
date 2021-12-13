import View from 'components/View';
import Window from 'components/L2/Window/Window';
import { useLocalRouter } from 'lib/LocalRouter';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import HeaderPane from 'components/L2/Window/HeaderPane';
import { Box, Row, Text } from '@tlon/indigo-react';
import BodyPane from 'components/L2/Window/BodyPane';
import { WithdrawForm } from './WithdrawForm';
import { useCallback, useState } from 'react';
import Dropdown from 'components/L2/Dropdowns/Dropdown';
import { TransferForm } from './TransferForm';

import './StarRelease.scss';

export default function StarRelease() {
  const { pop }: any = useLocalRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(true);

  const handleDropdownClick = useCallback(() => {
    setIsWithdrawing(!isWithdrawing);
    setDropdownOpen(false);
  }, [isWithdrawing]);

  return (
    <View
      pop={pop}
      hideBack
      inset
      className="issue-child"
      header={<L2BackHeader hideBalance={false} back={pop} />}>
      <Window className="id-issue-child">
        <HeaderPane>
          <Row>
            <h5>Locked Stars</h5>
          </Row>
        </HeaderPane>
        <BodyPane>
          <Box className="inner-container">
            <Dropdown
              className="star-release-dropdown"
              open={dropdownOpen}
              value={isWithdrawing ? 'Withdraw' : 'Transfer'}
              toggleOpen={() => setDropdownOpen(!dropdownOpen)}>
              <Box className="options">
                <Row className="option" onClick={handleDropdownClick}>
                  <Text>{isWithdrawing ? 'Transfer' : 'Withdraw'}</Text>
                </Row>
              </Box>
            </Dropdown>
            {isWithdrawing ? (
              <WithdrawForm afterSubmit={() => console.log('after submit')} />
            ) : (
              <TransferForm afterSubmit={() => console.log('after submit')} />
            )}
          </Box>
        </BodyPane>
      </Window>
    </View>
  );
}
