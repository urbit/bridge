import React, { useCallback } from 'react';
import * as need from 'lib/need';
import { Grid } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';
// import { usePointCache } from 'store/pointCache';

import View from 'components/View';
import Passport from 'components/Passport';
import { ForwardButton } from 'components/Buttons';

import useInvites from 'lib/useInvites';
import { ROUTE_NAMES } from 'lib/routeNames';

import { useHistory } from 'store/history';
import FooterButton from 'components/FooterButton';

export default function Admin() {
  const history = useHistory();
  const { pointCursor } = usePointCursor();
  // const { pointCache } = usePointCache();

  const point = need.pointCursor(pointCursor);

  // fetch the invites for the current cursor
  const { availableInvites } = useInvites(point);

  const goReticket = useCallback(() => history.push(ROUTE_NAMES.RETICKET), [
    history,
  ]);

  // const pointDetails = need.fromPointCache(pointCache, point);

  return (
    <View>
      <Grid className="pt2">
        <Grid.Item full>
          //TODO "Set Keys" when unset?
          <ForwardButton detail="Configure public keys">
            Edit Keys
          </ForwardButton>
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item full>
          //TODO disable if not logged in as owner
          <ForwardButton detail="Get a new master ticket" onClick={goReticket}>
            Reticket
          </ForwardButton>
        </Grid.Item>
      </Grid>

      <FooterButton detail="Transfer this identity to a new owner" disabled>
        Transfer
      </FooterButton>
    </View>
  );
}
