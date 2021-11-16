import * as need from 'lib/need';
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
import useRoller from 'lib/useRoller';
import { Ship } from '@urbit/roller-api';
import { RequestRow } from './RequestRow';

export const Requests = () => {
  const { pop }: any = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { api, adoptPoint, rejectPoint } = useRoller();
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

  const handleAcceptClick = useCallback(
    async (point: Ship) => {
      setLoading(true);
      await adoptPoint(point);
      await fetchRequests();
    },
    [adoptPoint, fetchRequests]
  );

  const handleRejectClick = useCallback(
    async (point: Ship) => {
      setLoading(true);
      await rejectPoint(point);
      await fetchRequests();
    },
    [rejectPoint, fetchRequests]
  );

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
                  <RequestRow
                    point={sp}
                    onAccept={handleAcceptClick}
                    onReject={handleRejectClick}
                  />
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
