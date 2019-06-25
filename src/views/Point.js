import React, { useCallback } from 'react';
import * as need from 'lib/need';
import { Grid } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';

import View from 'components/View';
import Passport from 'components/Passport';
import { ForwardButton } from 'components/Buttons';

import useInvites from 'lib/useInvites';
import useSyncPoint from 'lib/useSyncPoint';
import { ROUTE_NAMES } from 'lib/routeNames';

import { useHistory } from 'store/history';
import FooterButton from 'components/FooterButton';
import loadingCharacter from 'lib/loadingCharacter';
import Actions from './Point/Actions';

export default function Point() {
  const history = useHistory();
  const { pointCursor } = usePointCursor();
  // const { pointCache } = usePointCache();

  const point = need.pointCursor(pointCursor);

  // fetch the invites for the current cursor
  const { availableInvites } = useInvites(point);
  const availableInvitesText = loadingCharacter(availableInvites);

  const goInvite = useCallback(() => history.push(ROUTE_NAMES.INVITE), [
    history,
  ]);

  // sync the current cursor
  useSyncPoint(point);

  return (
    <View>
      <Passport point={point} />
      <Grid className="pt2">
        <Grid.Item full>
          <ForwardButton disabled>Admin</ForwardButton>
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item full>
          <ForwardButton detail="Boot your computer" disabled>
            Boot Arvo
          </ForwardButton>
        </Grid.Item>
        {/* <Grid.Item full>
          <Actions />
        </Grid.Item> */}
      </Grid>

      <FooterButton onClick={goInvite}>
        Invite <sup>{availableInvitesText}</sup>
      </FooterButton>
    </View>
  );
}
