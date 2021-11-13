import * as need from 'lib/need';
import { Row } from '@tlon/indigo-react';

import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { useLocalRouter } from 'lib/LocalRouter';
import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useEffect } from 'react';

export const Requests = () => {
  const { pop }: any = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);

  const { getResidents, syncResidents } = usePointCache();
  const { requestCount } = getResidents(point);

  useEffect(() => {
    console.log('sync');
    syncResidents(point);
  }, [point, syncResidents]);

  return (
    <View
      className="ops-residents"
      pop={pop}
      inset
      hideBack
      header={<L2BackHeader hideBalance back={pop} />}>
      <Window>
        <HeaderPane>
          <Row className="header-row">
            <h5>
              Requests{' '}
              <span className="header-count">{requestCount?.value || 0}</span>
            </h5>
          </Row>
        </HeaderPane>
        <BodyPane>
          <p>Requests go here</p>
        </BodyPane>
      </Window>
    </View>
  );
};
