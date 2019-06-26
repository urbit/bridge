import React, { useCallback } from 'react';
import Maybe from 'folktale/maybe';
import * as need from 'lib/need';
import { Grid } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';
import { useHistory } from 'store/history';

import View from 'components/View';
import Passport from 'components/Passport';
import { ForwardButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';
import { matchBlinky } from 'components/Blinky';

import useInvites from 'lib/useInvites';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';
import { ROUTE_NAMES } from 'lib/routeNames';

import Actions from './Point/Actions';
import { useWallet } from 'store/wallet';

export default function Point() {
  const history = useHistory();
  const { pointCursor } = usePointCursor();
  const { wallet } = useWallet();

  const point = need.pointCursor(pointCursor);

  // fetch the invites for the current cursor
  const { availableInvites } = useInvites(point);
  const availableInvitesText = matchBlinky(availableInvites);

  const showActions = Maybe.Just.hasInstance(wallet);

  const goInvite = useCallback(() => history.push(ROUTE_NAMES.INVITE), [
    history,
  ]);

  // sync the current cursor
  useSyncOwnedPoints([point]);

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
        {showActions && (
          <Grid.Item full>
            <Actions />
          </Grid.Item>
        )}
      </Grid>

      <FooterButton onClick={goInvite}>
        Invite <sup>{availableInvitesText}</sup>
      </FooterButton>
    </View>
  );
}
