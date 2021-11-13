import * as need from 'lib/need';
import ob from 'urbit-ob';
import { Box, Row } from '@tlon/indigo-react';

import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { useLocalRouter } from 'lib/LocalRouter';
import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import { usePointCursor } from 'store/pointCursor';
import { useCallback, useEffect, useState } from 'react';

import './Residents.scss';
import Sigil from 'components/Sigil';
import useRoller from 'lib/useRoller';
import { Ship } from '@urbit/roller-api';

export const Residents = () => {
  const { pop }: any = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { api } = useRoller();
  const [sponsoredPoints, setSponsoredPoints] = useState<Ship[]>([]);

  const fetchResidents = useCallback(async () => {
    if (!point) {
      return;
    }

    // TODO: remove this hack once the API is updated
    const { residentes, residents } = await api.getSponsoredPoints(point);

    setSponsoredPoints((residents || residentes || []).sort());
  }, [api, point]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

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
              Residents{' '}
              <span className="header-count">{sponsoredPoints.length}</span>
            </h5>
          </Row>
        </HeaderPane>
        <BodyPane>
          <Box className="content-container">
            <ul className="residents-list">
              {sponsoredPoints.map(sp => (
                <li>
                  <Box className="sigil">
                    <Box className="sigil-container">
                      <Sigil
                        icon
                        patp={ob.patp(sp)}
                        size={16}
                        colors={['#000000', '#FFFFFF']}
                      />
                    </Box>
                  </Box>
                  <Box className={'patp'}>{ob.patp(sp)}</Box>
                </li>
              ))}
            </ul>
          </Box>
        </BodyPane>
      </Window>
    </View>
  );
};
