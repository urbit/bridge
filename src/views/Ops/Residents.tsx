import * as need from 'lib/need';
import { Box, LoadingSpinner, Row } from '@tlon/indigo-react';

import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { useLocalRouter } from 'lib/LocalRouter';
import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import { usePointCursor } from 'store/pointCursor';
import { useCallback, useEffect, useMemo, useState } from 'react';

import './Residents.scss';
import useRoller from 'lib/useRoller';
import { Ship } from '@urbit/roller-api';
import { ResidentRow } from './ResidentRow';

export const Residents = () => {
  const { pop }: any = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const point = useMemo(() => need.point(pointCursor), [pointCursor]);
  const { api, kickPoint } = useRoller();
  const [sponsoredPoints, setSponsoredPoints] = useState<Ship[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchResidents = useCallback(async () => {
    if (!point) {
      return;
    }

    setLoading(true);
    // TODO: remove this hack once the API is updated
    const { residentes, residents } = await api.getSponsoredPoints(point);
    setSponsoredPoints((residents || residentes || []).sort());
    setLoading(false);
  }, [api, point]);

  const handleKick = useCallback(
    async (point: Ship) => {
      setLoading(true);
      await kickPoint(point);
      await fetchResidents();
    },
    [fetchResidents, kickPoint]
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
            {loading ? (
              <Box className={'loading'}>
                <LoadingSpinner />
              </Box>
            ) : sponsoredPoints.length > 0 ? (
              <ul className="residents-list">
                {sponsoredPoints.map(sp => (
                  <ResidentRow point={sp} onKick={handleKick} />
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
