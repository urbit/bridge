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

import { ResidentRow } from './ResidentRow';
import './Residents.scss';

export const Residents = () => {
  const { pop }: any = useLocalRouter();
  const { point, setLoading } = useRollerStore();
  const { api, changeSponsorship } = useRoller();
  const [sponsoredPoints, setSponsoredPoints] = useState<Ship[]>([]);

  const fetchResidents = useCallback(async () => {
    if (!point) {
      return;
    }

    setLoading(true);
    // TODO: remove this hack once the API is updated
    const { residentes, residents } = await api.getSponsoredPoints(point.value);
    setSponsoredPoints((residents || residentes || []).sort());
    setLoading(false);
  }, [api, point, setLoading]);

  const handleKick = useCallback(
    async (ship: Ship) => {
      setLoading(true);
      await changeSponsorship(ship, 'detach', point.isL1);
      await fetchResidents();
      setLoading(false);
    },
    [setLoading, changeSponsorship, point.isL1, fetchResidents]
  );

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
            {sponsoredPoints.length > 0 ? (
              <ul className="residents-list">
                {sponsoredPoints.map(sp => (
                  <ResidentRow key={sp} point={sp} onKick={handleKick} />
                ))}
              </ul>
            ) : (
              <Box className="no-results">No residents</Box>
            )}
          </Box>
        </BodyPane>
      </Window>
    </View>
  );
};
