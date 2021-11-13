import * as need from 'lib/need';
import ob from 'urbit-ob';
import { Box, LoadingSpinner, Row } from '@tlon/indigo-react';

import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { useLocalRouter } from 'lib/LocalRouter';
import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import { usePointCursor } from 'store/pointCursor';
import { useCallback, useEffect, useState } from 'react';

import './Requests.scss';
import Sigil from 'components/Sigil';
import useRoller from 'lib/useRoller';
import { Ship } from '@urbit/roller-api';

export const Requests = () => {
  const { pop }: any = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { api } = useRoller();
  const [requestingPoints, setRequestingPoints] = useState<Ship[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRequests = useCallback(async () => {
    if (!point) {
      return;
    }

    setLoading(true);
    const { requests } = await api.getSponsoredPoints(point);

    setRequestingPoints((requests || []).sort());
    setLoading(false);
  }, [api, point]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <View
      className="ops-requests"
      pop={pop}
      inset
      hideBack
      header={<L2BackHeader hideBalance back={pop} />}>
      <Window>
        <HeaderPane>
          <Row className="header-row">
            <h5>
              Requests{' '}
              <span className="header-count">{requestingPoints.length}</span>
            </h5>
          </Row>
        </HeaderPane>
        <BodyPane>
          <Box className="content-container">
            {loading ? (
              <Box className={'loading'}>
                <LoadingSpinner />
              </Box>
            ) : requestingPoints.length > 0 ? (
              <ul className="requests-list">
                {requestingPoints.map(sp => (
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
            ) : (
              <Box className="no-results">No requests</Box>
            )}
          </Box>
        </BodyPane>
      </Window>
    </View>
  );
};
