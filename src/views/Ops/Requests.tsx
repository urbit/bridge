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
  const { pop, push, names }: any = useLocalRouter();
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
      if (point.isL1) {
        push(names.L1_SPONSORSHIP, {
          adoptee: ship,
          denied: false,
        });
      } else {
        setLoading(true);
        await changeSponsorship(ship, 'adopt');
        await fetchRequests();
        setLoading(false);
      }
    },
    [
      changeSponsorship,
      fetchRequests,
      names.L1_SPONSORSHIP,
      point.isL1,
      push,
      setLoading,
    ]
  );

  const handleRejectClick = useCallback(
    async (ship: Ship) => {
      if (point.isL1) {
        push(names.L1_SPONSORSHIP, {
          adoptee: ship,
          denied: true,
        });
      } else {
        setLoading(true);
        await changeSponsorship(ship, 'reject');
        await fetchRequests();
        setLoading(false);
      }
    },
    [
      changeSponsorship,
      fetchRequests,
      names.L1_SPONSORSHIP,
      point.isL1,
      push,
      setLoading,
    ]
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
