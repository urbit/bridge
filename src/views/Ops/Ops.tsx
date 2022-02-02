import { useCallback } from 'react';
import * as need from 'lib/need';
import { Box, Row, Button, Icon } from '@tlon/indigo-react';

import { useRollerStore } from 'store/rollerStore';
import { usePointCursor } from 'store/pointCursor';

import { useLocalRouter } from 'lib/LocalRouter';
import { isGalaxy } from 'lib/utils/point';

import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';

import './Ops.scss';

export const Ops = () => {
  const { pop, push, popAndPush, names }: any = useLocalRouter();
  const { pointCursor }: any = usePointCursor();
  const { point } = useRollerStore();
  const _point = need.point(pointCursor);

  const goSenate = useCallback(() => push(names.SENATE), [push, names]);
  const goResidents = useCallback(() => push(names.RESIDENTS), [push, names]);
  const goRequests = useCallback(() => push(names.REQUESTS), [push, names]);
  const goIssuePoint = useCallback(() => push(names.ISSUE_CHILD), [
    names.ISSUE_CHILD,
    push,
  ]);
  const goUrbitOS = useCallback(() => popAndPush(names.URBIT_OS), [
    names.URBIT_OS,
    popAndPush,
  ]);

  const getButtonContent = () => {
    if (!point.couldSpawn) {
      return null;
    } else if (point.networkKeysSet) {
      return (
        <Button onClick={goIssuePoint} className="header-button">
          <Icon icon="Node" /> &nbsp;Spawn&nbsp;
          {isGalaxy(_point) ? 'Stars' : 'Planets'}
        </Button>
      );
    }
    return (
      <Button onClick={goUrbitOS} className="header-button">
        Set Network Keys
      </Button>
    );
  };

  return (
    <View
      pop={pop}
      inset
      hideBack
      className="ops"
      header={<L2BackHeader hideBalance back={pop} />}>
      <Window className="id-ops">
        <HeaderPane>
          <Row className="header-row">
            <h5>{isGalaxy(_point) ? 'Galaxy' : 'Star'} Ops</h5>
            {getButtonContent()}
          </Row>
        </HeaderPane>
        <BodyPane>
          <Row className="between-row management">
            <Box>
              <Box className="section-title">Residents</Box>
              <Box className="subtitle">
                {isGalaxy(_point) ? 'Stars' : 'Planets'} that you route packets
                for
              </Box>
            </Box>
            <Button className="secondary" onClick={goResidents}>
              View
            </Button>
          </Row>
          <Row className="between-row management">
            <Box>
              <Box className="section-title">Requests</Box>
              <Box className="subtitle">
                {isGalaxy(_point) ? 'Stars' : 'Planets'} requesting your
                sponsorship
              </Box>
            </Box>
            <Button className="secondary" onClick={goRequests}>
              View
            </Button>
          </Row>
          {point.isGalaxy && (
            <Row className="between-row management">
              <Box>
                <Box className="section-title">Proposals</Box>
                <Box className="subtitle">
                  View or vote on proposals in the Senate
                </Box>
              </Box>
              <Button className="secondary" onClick={goSenate}>
                View
              </Button>
            </Row>
          )}
        </BodyPane>
      </Window>
    </View>
  );
};
