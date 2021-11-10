import * as need from 'lib/need';
import { Box, Row, Button, Icon } from '@tlon/indigo-react';

import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { useCallback } from 'react';
import { useLocalRouter } from 'lib/LocalRouter';
import { isGalaxy } from 'lib/utils/point';
import { usePointCursor } from 'store/pointCursor';
import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';

export const Ops = () => {
  const { pop, push, names }: any = useLocalRouter();
  const { pointCursor }: any = usePointCursor();
  const point = need.point(pointCursor);

  const goSenate = useCallback(() => push(names.SENATE), [push, names]);
  const goResidents = useCallback(() => push(names.RESIDENTS), [push, names]);
  const goIssuePoint = useCallback(() => push(names.ISSUE_CHILD), [
    names.ISSUE_CHILD,
    push,
  ]);

  return (
    <View
      id="ops"
      pop={pop}
      inset
      hideBack
      className="urbit-id"
      header={<L2BackHeader hideBalance back={pop} />}>
      <Window className="id-ops">
        <HeaderPane>
          <Row className="header-row">
            <h5>{isGalaxy(point) ? 'Galaxy' : 'Star'} Ops</h5>
            <Button onClick={goIssuePoint} className="header-button">
              <Icon icon="Node" /> &nbsp;Spawn&nbsp;
              {isGalaxy(point) ? 'Stars' : 'Planets'}
            </Button>
          </Row>
        </HeaderPane>
        <BodyPane>
          <Row className="between-row management">
            <Box>
              <Box>Residents</Box>
              <Box className="subtitle">Planets that you route packets for</Box>
            </Box>
            <Button className="secondary" onClick={goResidents}>
              View
            </Button>
          </Row>
          <Row className="between-row management">
            <Box>
              <Box>Requests</Box>
              <Box className="subtitle">
                Planets requesting your sponsorship
              </Box>
            </Box>
            <Button className="secondary" onClick={goResidents}>
              View
            </Button>
          </Row>
          {isGalaxy(point) && (
            <Row className="between-row management">
              <Box>
                <Box>Proposals</Box>
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
