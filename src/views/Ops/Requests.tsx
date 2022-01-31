import { useCallback, useEffect, useState } from 'react';
import { Box, Row } from '@tlon/indigo-react';
import { Ship } from '@urbit/roller-api';

import { useRollerStore } from 'store/rollerStore';
import useRoller from 'lib/useRoller';
import { useLocalRouter } from 'lib/LocalRouter';

import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';

import { RequestRow } from './RequestRow';
import './Requests.scss';

export const Requests = () => {
  const { pop }: any = useLocalRouter();
  const { point, setLoading } = useRollerStore();
  const { api, changeSponsorship } = useRoller();
  const [requestingPoints, setRequestingPoints] = useState<Ship[]>([]);

  const fetchRequests = useCallback(async () => {
    if (!point) {
      return;
    }

    setLoading(true);
    const { requests } = await api.getSponsoredPoints(point.value);
    setRequestingPoints((requests || []).sort());
    setLoading(false);
  }, [api, point, setLoading]);

  const handleAcceptClick = useCallback(
    async (ship: Ship) => {
      setLoading(true);
      await changeSponsorship(ship, 'adopt', point.isL1);
      await fetchRequests();
      setLoading(false);
    },
    [changeSponsorship, fetchRequests, point.isL1, setLoading]
  );

  const handleRejectClick = useCallback(
    async (ship: Ship) => {
      setLoading(true);
      await changeSponsorship(ship, 'reject', point.isL1);
      await fetchRequests();
      setLoading(false);
    },
    [changeSponsorship, fetchRequests, point.isL1, setLoading]
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
            {requestingPoints.length > 0 ? (
              <ul className="requests-list">
                {requestingPoints.map(sp => (
                  <RequestRow
                    key={sp}
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
